# preprocess.py
import pandas as pd
import numpy as np

def classificar_morfo(valor):
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
    # Substitui valores da coluna 'Ploidia' se existir (para treino, mas pode ser ignorado)
    if 'Ploidia' in df.columns:
        df['Ploidia'] = df['Ploidia'].replace({'Euplóide': 1, 'Aneuplóide': 0})

    # Remove a letra "D" da coluna Estágio e converte para numérico
    df['Estágio'] = df['Estágio'].astype(str).str.replace("D", "", regex=False)
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
