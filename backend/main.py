from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
import pandas as pd
import os
import uvicorn

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

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
