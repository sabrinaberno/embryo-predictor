from fastapi import FastAPI, UploadFile, File
import pandas as pd
import numpy as np
import joblib
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Libera tudo pro front (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ajuste depois para seu domínio real
    allow_methods=["*"],
    allow_headers=["*"],
)

# Carregar modelo e scaler
modelo = joblib.load("backend/melhor_modelo_mlp_20250610_113659.pkl")
scaler = joblib.load("backend/scaler_mlp_20250610_113659.pkl")
colunas_treinadas = scaler.feature_names_in_

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

@app.get("/")
async def root():
    return {"message": "API está no ar!"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Ler o arquivo Excel enviado
    data = pd.read_excel(file.file)

    # Pré-processamento sem ploidia
    data['Estágio'] = data['Estágio'].str.replace("D", "", regex=False)
    data['Estágio'] = pd.to_numeric(data['Estágio'], errors='coerce')
    data['Morfo'] = data['Morfo'].apply(classificar_morfo)

    data_numerica = data.select_dtypes(include=[np.number]).copy()

    # Normalização manual
    for col in data_numerica.columns:
        mean = data_numerica[col].mean()
        std = data_numerica[col].std()
        if std > 0:
            data_numerica[col] = (data_numerica[col] - mean) / std
        else:
            data_numerica[col] = 0

    # Preparar X para o modelo
    X = data_numerica.copy()
    for col in colunas_treinadas:
        if col not in X.columns:
            X[col] = 0
    X = X[colunas_treinadas]

    # Escalar e prever
    X_scaled = scaler.transform(X)
    classes_preditas = modelo.predict(X_scaled)
    probs = modelo.predict_proba(X_scaled)[:, 1]  # prob. de Euploide

    # Criar resultado pro front
    results = []
    for idx, row in data.iterrows():
        results.append({
            "embryoId": row.get("embryoId", str(idx)),
            "ploidyStatus": "Euploide" if classes_preditas[idx] == 0 else "Aneuploide",
            "confidenceScore": round(probs[idx] * 100, 2)
        })

    return {"results": results}