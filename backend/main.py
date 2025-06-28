from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
import pandas as pd

from .preprocess import preprocess_planilha
from .predict_model import rodar_predicao

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_excel(BytesIO(contents))

    df_preprocessada = preprocess_planilha(df)

    if df_preprocessada.isnull().values.any():
        raise HTTPException(
            status_code=400,
            detail="A planilha contém valores vazios. Preencha todos os campos obrigatórios antes de enviar."
        )

    resposta = rodar_predicao(df_preprocessada)
    return resposta