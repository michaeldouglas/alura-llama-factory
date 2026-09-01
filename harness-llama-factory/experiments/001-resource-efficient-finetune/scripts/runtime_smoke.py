"""Read-only runtime smoke probes for the G2 environment gate."""

from __future__ import annotations

import argparse
import json
import platform
import struct
import sys


def identity() -> None:
    import llamafactory
    import torch

    print(
        json.dumps(
            {
                "python": sys.version,
                "python_version": platform.python_version(),
                "architecture": platform.machine(),
                "pointer_bits": struct.calcsize("P") * 8,
                "torch": torch.__version__,
                "llamafactory": llamafactory.__version__,
                "xpu_available": bool(torch.xpu.is_available()),
                "xpu_device_count": int(torch.xpu.device_count()) if torch.xpu.is_available() else 0,
            }
        )
    )


def xpu_probe() -> None:
    import torch
    import torch.nn.functional as F

    if not torch.xpu.is_available() or torch.xpu.device_count() < 1:
        raise RuntimeError("XPU is unavailable or has no device")

    def finite(value: torch.Tensor) -> bool:
        return bool(torch.isfinite(value).all().item())

    device = torch.device("xpu")
    torch.manual_seed(17)
    features = torch.randn((4, 8), device=device, requires_grad=True)
    weights = torch.randn((8, 8), device=device, requires_grad=True)
    embedding = torch.nn.Embedding(32, 8).to(device)
    indices = torch.tensor([1, 3, 5, 7], device=device)
    embedded = embedding(indices)
    matmul = features @ weights
    normalized = F.normalize(matmul, dim=-1)
    target = torch.zeros_like(normalized)
    loss = F.mse_loss(normalized, target) + embedded.square().mean()
    optimizer = torch.optim.SGD(list(embedding.parameters()) + [features, weights], lr=0.01)
    optimizer.zero_grad(set_to_none=True)
    loss.backward()
    optimizer.step()
    torch.xpu.synchronize()

    finite_values = all(finite(value) for value in (matmul, embedded, normalized, loss))
    finite_gradients = all(
        parameter.grad is not None and finite(parameter.grad)
        for parameter in (features, weights, *embedding.parameters())
    )
    result = {
        "device_name": torch.xpu.get_device_name(0),
        "tensor_shape": list(features.shape),
        "matmul": True,
        "embedding": True,
        "normalization": True,
        "loss": float(loss.detach().cpu().item()),
        "backward": True,
        "optimizer_step": True,
        "finite_values": finite_values,
        "finite_gradients": finite_gradients,
    }
    print(json.dumps(result))
    if not finite_values or not finite_gradients:
        raise RuntimeError("synthetic XPU probe produced non-finite values")


def cpu_probe() -> None:
    import torch

    values = torch.ones((2, 2), device="cpu")
    print(json.dumps({"available": True, "finite": bool(torch.isfinite(values @ values).all().item())}))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("identity", "xpu", "cpu"), required=True)
    args = parser.parse_args()
    {"identity": identity, "xpu": xpu_probe, "cpu": cpu_probe}[args.mode]()


if __name__ == "__main__":
    main()
