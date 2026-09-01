"""Aplicação de terminal para preparar e publicar os modelos do EscutIA."""

from __future__ import annotations

import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

from huggingface_hub import HfApi
import questionary
from rich.console import Console
from rich.panel import Panel
from rich.table import Table


HF_DIR = Path(__file__).resolve().parent
MODELOS_DIR = HF_DIR / "modelos"
SCRIPTS_DIR = HF_DIR / "script"
PREPARAR_LORA = SCRIPTS_DIR / "preparar_lora_zip.py"
MESCLAR_LORA = SCRIPTS_DIR / "mesclar_lora.py"
LORA_ZIP = MODELOS_DIR / "lora.zip"
QLORA_ZIP = MODELOS_DIR / "qlora.zip"
LORA_COMPLETO_DIR = MODELOS_DIR / "completos" / "escutia-lora"
REPOSITORIOS = (
    ("LoRA", LORA_ZIP, "mdba/escutia-lora"),
    ("QLoRA", QLORA_ZIP, "mdba/escutia-qlora"),
)
METADADOS = {
    "LoRA": """---
base_model: Qwen/Qwen2.5-0.5B-Instruct
base_model_relation: adapter
library_name: peft
language:
- pt
pipeline_tag: text-generation
tags:
- lora
- peft
- sentiment-analysis
- portuguese
---
""",
    "QLoRA": """---
base_model: Qwen/Qwen2.5-1.5B-Instruct
base_model_relation: adapter
library_name: peft
language:
- pt
pipeline_tag: text-generation
tags:
- qlora
- lora
- peft
- bitsandbytes
- sentiment-analysis
- portuguese
---
""",
}

# O token fica somente na memória durante a execução do aplicativo.
HF_TOKEN: str | None = None

console = Console()


def mostrar_cabecalho() -> None:
    """Exibe a identidade visual da aplicação."""

    console.print()
    console.print(
        Panel.fit(
            "[bold white]EscutAI Modelos[/bold white]\n"
            "[dim]Preparação de artefatos para publicação[/dim]",
            border_style="cyan",
            padding=(1, 5),
        )
    )


def mostrar_status() -> None:
    """Mostra uma tabela compacta com o estado dos pacotes."""

    table = Table(title="Status dos modelos", border_style="blue")
    table.add_column("Modelo", style="cyan")
    table.add_column("Arquivo", style="white")
    table.add_column("Status", justify="center")

    for nome, caminho, repositorio in REPOSITORIOS:
        if caminho.is_file():
            status = "[bold green]Pronto[/bold green]"
        else:
            status = "[bold yellow]Pendente[/bold yellow]"
        table.add_row(nome, f"{caminho.name} → {repositorio}", status)

    completo_status = (
        "[bold green]Pronto[/bold green]"
        if LORA_COMPLETO_DIR.is_dir()
        else "[bold yellow]Pendente[/bold yellow]"
    )
    table.add_row("LoRA completo", "escutia-lora", completo_status)
    table.add_row("QLoRA completo", "Fazer no Colab", "[bold yellow]Fazer no Colab[/bold yellow]")

    console.print(table)


def preparar_zips() -> None:
    """Prepara o ZIP LoRA somente quando ele ainda não existe."""

    # Se os dois pacotes já existem, não chama nenhum script nem reescreve arquivos.
    if LORA_ZIP.is_file() and QLORA_ZIP.is_file():
        console.print("\n[bold green]Os zips já estão preparados.[/bold green]")
        return

    # Atualmente o projeto possui o preparador LoRA. O QLoRA já é fornecido
    # como artefato pronto e terá seu próprio fluxo quando essa etapa for criada.
    if not LORA_ZIP.is_file():
        MODELOS_DIR.mkdir(parents=True, exist_ok=True)
        try:
            with console.status(
                "[bold cyan]Preparando os artefatos LoRA...[/bold cyan]",
                spinner="dots",
            ):
                subprocess.run(
                    [sys.executable, str(PREPARAR_LORA)],
                    cwd=HF_DIR,
                    check=True,
                    capture_output=True,
                    text=True,
                )
        except subprocess.CalledProcessError as error:
            console.print(
                "\n[bold red]Não foi possível preparar os zips.[/bold red]"
            )
            detalhe = (error.stderr or error.stdout or "").strip()
            if detalhe:
                console.print(f"[dim]{detalhe}[/dim]")
            return

    if LORA_ZIP.is_file() and QLORA_ZIP.is_file():
        console.print("\n[bold green]Zips preparados.[/bold green]")
    else:
        ausentes = [caminho.name for _, caminho, _ in REPOSITORIOS if not caminho.is_file()]
        console.print(
            "\n[bold yellow]Ainda falta preparar: "
            + ", ".join(ausentes)
            + "[/bold yellow]"
        )


def configurar_huggingface() -> None:
    """Solicita e valida um token sem gravá-lo no projeto."""

    global HF_TOKEN

    token = questionary.password(
        "Cole seu token do Hugging Face (a entrada ficará oculta):",
        instruction="Use um token com permissão Write.",
    ).ask()
    token = (token or "").strip()

    if not token:
        console.print("\n[bold yellow]Nenhum token foi informado.[/bold yellow]")
        return

    try:
        with console.status(
            "[bold cyan]Validando o token no Hugging Face...[/bold cyan]",
            spinner="dots",
        ):
            identidade = HfApi(token=token).whoami()
    except Exception:
        console.print(
            "\n[bold red]Não foi possível validar o token.[/bold red]"
        )
        console.print(
            "[dim]Confira se ele está ativo e possui permissão Write.[/dim]"
        )
        return

    HF_TOKEN = token
    usuario = identidade.get("name") or identidade.get("email") or "usuário autenticado"
    console.print(f"\n[bold green]Hugging Face configurado para {usuario}.[/bold green]")
    console.print("[dim]O token ficará somente na memória desta execução.[/dim]")


def mesclar_lora() -> None:
    """Mescla o adapter LoRA ao modelo-base localmente."""

    if LORA_COMPLETO_DIR.is_dir():
        console.print(
            "\n[bold green]O modelo LoRA completo já foi preparado.[/bold green]"
        )
        console.print("[bold yellow]QLoRA completo: Fazer no Colab.[/bold yellow]")
        return

    try:
        console.print(
            "\n[bold cyan]Iniciando o merge do LoRA. "
            "As etapas aparecerão abaixo:[/bold cyan]"
        )
        subprocess.run(
            [sys.executable, "-u", str(MESCLAR_LORA)],
            cwd=HF_DIR,
            check=True,
        )
    except subprocess.CalledProcessError as error:
        console.print("\n[bold red]Não foi possível mesclar o modelo LoRA.[/bold red]")
        console.print(f"[dim]O processo terminou com código {error.returncode}.[/dim]")
        return

    console.print("\n[bold green]Modelo LoRA completo preparado.[/bold green]")
    console.print("[bold yellow]QLoRA completo: Fazer no Colab.[/bold yellow]")


def extrair_zip_com_seguranca(zip_path: Path, destino: Path) -> Path:
    """Extrai um pacote e impede caminhos que escapem do diretório temporário."""

    destino.mkdir(parents=True, exist_ok=True)
    raiz = destino.resolve()

    with zipfile.ZipFile(zip_path) as archive:
        for membro in archive.infolist():
            caminho = (destino / membro.filename).resolve()
            if raiz not in caminho.parents and caminho != raiz:
                raise ValueError(f"Caminho inválido encontrado no ZIP: {membro.filename}")
            if membro.is_dir():
                caminho.mkdir(parents=True, exist_ok=True)
                continue
            caminho.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(membro) as origem, caminho.open("wb") as arquivo:
                arquivo.write(origem.read())

    subpastas = [item for item in destino.iterdir() if item.is_dir()]
    arquivos = [item for item in destino.iterdir() if item.is_file()]
    if len(subpastas) == 1 and not arquivos:
        return subpastas[0]
    return destino


def garantir_metadados_model_card(pasta: Path, nome: str) -> None:
    """Adiciona o YAML do Model Card sem modificar o ZIP original."""

    readme = pasta / "README.md"
    if not readme.is_file():
        return

    conteudo = readme.read_text(encoding="utf-8")
    if conteudo.lstrip().startswith("---"):
        return

    readme.write_text(
        METADADOS[nome].rstrip() + "\n\n" + conteudo.lstrip(),
        encoding="utf-8",
    )


def detalhe_erro_seguro(error: Exception) -> str:
    """Exibe a causa do erro sem permitir que o token apareça no terminal."""

    detalhe = f"{type(error).__name__}: {error}".strip()
    if HF_TOKEN:
        detalhe = detalhe.replace(HF_TOKEN, "[TOKEN OCULTO]")
    return detalhe


def subir_modelos() -> None:
    """Publica o LoRA completo e o QLoRA como adapter ZIP."""

    if HF_TOKEN is None:
        console.print(
            "\n[bold yellow]Configure o Hugging Face pela opção 2 antes do upload.[/bold yellow]"
        )
        return

    ausentes = [caminho.name for _, caminho, _ in REPOSITORIOS if not caminho.is_file()]
    if ausentes:
        console.print(
            "\n[bold yellow]Não foi possível enviar os modelos. "
            "Arquivos ausentes: "
            + ", ".join(ausentes)
            + "[/bold yellow]"
        )
        return

    if not LORA_COMPLETO_DIR.is_dir():
        console.print(
            "\n[bold yellow]Mescle o modelo LoRA pela opção 3 antes do upload.[/bold yellow]"
        )
        console.print("[bold yellow]QLoRA: Fazer no Colab.[/bold yellow]")
        return

    api = HfApi(token=HF_TOKEN)
    etapa = "preparação do upload"
    try:
        with tempfile.TemporaryDirectory(prefix="escutia-huggingface-") as temporario:
            etapa = "upload do LoRA completo"
            console.print(
                "\n[bold cyan]Etapa 1/2:[/bold cyan] enviando o modelo LoRA completo..."
            )
            with console.status(
                "[bold cyan]Enviando o modelo LoRA completo...[/bold cyan]",
                spinner="dots",
            ):
                api.upload_folder(
                    repo_id="mdba/escutia-lora",
                    folder_path=str(LORA_COMPLETO_DIR),
                    repo_type="model",
                    commit_message="Publicar modelo LoRA completo do EscutIA",
                )
            console.print(
                "[green]✓ LoRA completo enviado:[/green] "
                "https://huggingface.co/mdba/escutia-lora"
            )

            etapa = "extração do QLoRA ZIP"
            qlora_dir = extrair_zip_com_seguranca(
                QLORA_ZIP, Path(temporario) / "qlora"
            )
            garantir_metadados_model_card(qlora_dir, "QLoRA")
            etapa = "upload do QLoRA como adapter"
            console.print(
                "\n[bold cyan]Etapa 2/2:[/bold cyan] enviando o QLoRA como adapter..."
            )
            with console.status(
                "[bold cyan]Enviando o QLoRA como adapter...[/bold cyan]",
                spinner="dots",
            ):
                api.upload_folder(
                    repo_id="mdba/escutia-qlora",
                    folder_path=str(qlora_dir),
                    repo_type="model",
                    commit_message="Publicar adapter QLoRA do EscutIA",
                )
            console.print(
                "[green]✓ QLoRA adapter enviado:[/green] "
                "https://huggingface.co/mdba/escutia-qlora"
            )
    except Exception as error:
        console.print(
            "\n[bold red]Não foi possível concluir o upload dos modelos.[/bold red]"
        )
        console.print(f"[bold yellow]Etapa que falhou: {etapa}[/bold yellow]")
        console.print(detalhe_erro_seguro(error), style="dim")
        console.print(
            "[dim]Verifique a permissão Write, os repositórios e a conexão com o Hugging Face.[/dim]"
        )
        return

    console.print("\n[bold green]Modelos enviados.[/bold green]")


def executar_menu() -> None:
    """Executa o menu principal até a pessoa escolher sair."""

    while True:
        mostrar_cabecalho()
        mostrar_status()
        escolha = questionary.select(
            "\nO que você gostaria de fazer?",
            choices=[
                questionary.Choice(
                    "1 - Preparar zips dos modelos", value="preparar"
                ),
                questionary.Choice(
                    "2 - Configurar Hugging Face", value="configurar"
                ),
                questionary.Choice(
                    "3 - Mesclar modelo completo LoRA (QLoRA: Fazer no Colab)",
                    value="mesclar",
                ),
                questionary.Choice(
                    "4 - Subir modelos (LoRA completo + QLoRA ZIP)", value="subir"
                ),
                questionary.Choice("Sair", value="sair"),
            ],
            pointer="➜",
        ).ask()

        if escolha in (None, "sair"):
            console.print("\n[dim]Até logo![/dim]")
            return

        if escolha == "preparar":
            preparar_zips()
        elif escolha == "configurar":
            configurar_huggingface()
        elif escolha == "mesclar":
            mesclar_lora()
        elif escolha == "subir":
            subir_modelos()

        if escolha in {"preparar", "configurar", "mesclar", "subir"}:
            questionary.press_any_key_to_continue(
                "\nPressione qualquer tecla para voltar ao menu..."
            ).ask()


if __name__ == "__main__":
    executar_menu()
