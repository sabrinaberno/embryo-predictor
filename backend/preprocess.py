# preprocess.py
import pandas as pd
import numpy as np
import unicodedata
import re

def remover_acentos(texto):
    return (
        unicodedata.normalize("NFD", texto)
        .encode("ascii", "ignore")
        .decode("utf-8")
        if isinstance(texto, str)
        else texto
    )

def classificar_morfo(valor):
    valor = str(valor).upper().strip()
    prefixo = valor[0]
    sufixo = valor[1:]

    if sufixo == "AA" and prefixo in "3456":
        return 1  # Excelente
    elif sufixo in ["AB", "BA"] and prefixo in "3456":
        return 2  # Bom
    elif sufixo in ["BB", "AC", "CA"] and prefixo in "3456":
        return 3  # Médio
    else:
        return 4  # Ruim

def preprocess_planilha(df: pd.DataFrame) -> pd.DataFrame:

    # 1. Remove acentos e normaliza nomes das colunas para evitar erros de capitalização e acentuação
    df.columns = [remover_acentos(col).strip().lower() for col in df.columns]

   # 2. Renomeia para os nomes originais do treinamento
    nomes_originais = {
        "idade": "Idade",
        "morfo": "Morfo",
        "estagio": "Estágio",
        "kidscore": "Kidscore",
        "tb": "tB",
        "pnf": "PNf",
        "pn": "PN",
        "tpnf": "tPNf",
        "tpn": "tPN",
        "t2": "t2",
        "t3": "t3",
        "t4": "t4",
        "t5": "t5",
        "t6": "t6",
        "t7": "t7",
        "t8": "t8",
        "t9+": "t9+",
        "cc2": "cc2",
        "s2": "s2",
        "cc3": "cc3",
        "s3": "s3",
        "tb-tsb": "tB-tSB",
        "tsb": "tSB",
        "tsc": "tSC",
        "tsc-t8": "tSC-t8",
        "ploidia": "Ploidia",
    }

    df.rename(columns=nomes_originais, inplace=True)

    # Substitui valores da coluna 'Ploidia' se existir (para treino, mas pode ser ignorado)
    if 'Ploidia' in df.columns:
        df['Ploidia'] = df['Ploidia'].astype(str).apply(lambda x: remover_acentos(x).strip().lower())
        df['Ploidia'] = df['Ploidia'].replace({
            'euploide': 1,
            'aneuploide': 0
        })

    # Remove a letra "D" da coluna Estágio e converte para numérico
    df['Estágio'] = df['Estágio'].astype(str).str.replace("d", "", regex=True, case=False)
    df['Estágio'] = pd.to_numeric(df['Estágio'], errors='coerce')

    # Aplica classificação da Morfo
    df['Morfo'] = df['Morfo'].apply(classificar_morfo)

    # Seleciona somente colunas numéricas (útil para o modelo)
    numeric_columns = df.select_dtypes(include=[np.number])

    return numeric_columns

if __name__ == "__main__":
    input_file = "PlanilhaCompleta.xlsx"
    df = pd.read_excel(input_file)
    df_numeric = preprocess_planilha(df)
    output_file = "PlanilhaNumerica.xlsx"
    df_numeric.to_excel(output_file, index=False)
