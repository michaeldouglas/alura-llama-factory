from pathlib import Path

import pandas as pd


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
DATA_DIR = PROJECT_DIR / "dados"

LOCAL_FILE = DATA_DIR / "dataset_local.csv"
OUTPUT_FILE = DATA_DIR / "dataset.csv"

DATA_DIR.mkdir(parents=True, exist_ok=True)


BASE_URL = (
    "https://huggingface.co/datasets/"
    "cardiffnlp/tweet_sentiment_multilingual/"
    "resolve/main/data/portuguese"
)


arquivos = [
    f"{BASE_URL}/train.jsonl",
    f"{BASE_URL}/validation.jsonl",
    f"{BASE_URL}/test.jsonl",
]


print("Baixando dataset do Hugging Face...")

dataframes = []

for arquivo in arquivos:
    print(f"Baixando: {arquivo}")

    df_split = pd.read_json(
        arquivo,
        lines=True
    )

    dataframes.append(df_split)


df_huggingface = pd.concat(
    dataframes,
    ignore_index=True
)

mapa_rotulos = {
    0: "negativo",
    1: "neutro",
    2: "positivo",
}

df_huggingface["label"] = df_huggingface["label"].map(mapa_rotulos)

df_huggingface = df_huggingface.rename(
    columns={
        "text": "texto",
        "label": "rotulo",
    }
)

df_huggingface = df_huggingface[
    ["texto", "rotulo"]
]


df_local = pd.read_csv(
    LOCAL_FILE,
    encoding="utf-8-sig"
)

df_local = df_local[
    ["texto", "rotulo"]
]

df_final = pd.concat(
    [
        df_local,
        df_huggingface
    ],
    ignore_index=True
)

df_final = df_final.drop_duplicates(
    subset=["texto"]
).reset_index(drop=True)

df_final.insert(
    0,
    "id",
    range(1, len(df_final) + 1)
)

df_final.to_csv(
    OUTPUT_FILE,
    index=False,
    encoding="utf-8-sig"
)


print()
print(f"Dataset salvo em: {OUTPUT_FILE}")
print(f"Total de registros: {len(df_final)}")

print()
print("Distribuição:")
print(df_final["rotulo"].value_counts())
