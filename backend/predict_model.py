# predict_model.py
import pandas as pd
import joblib
from sklearn.metrics import accuracy_score, confusion_matrix, roc_auc_score, classification_report, roc_curve
import matplotlib.pyplot as plt
import seaborn as sns
import lime
import lime.lime_tabular
import numpy as np

def rodar_predicao(df: pd.DataFrame):
    modelo = joblib.load("backend/melhor_modelo_mlp_20250610_113659.pkl")
    scaler = joblib.load("backend/scaler_mlp_20250610_113659.pkl")

    X = df.drop(columns=["Ploidia"], errors="ignore").copy()
    if "embryoId" in X.columns:
        X.drop(columns=["embryoId"], inplace=True)
    y_true = df["Ploidia"]

    colunas_treinadas = scaler.feature_names_in_
    for col in colunas_treinadas:
        if col not in X.columns:
            X[col] = 0  

    X = X[colunas_treinadas]
    X_scaled = scaler.transform(X)

    classes_preditas = modelo.predict(X_scaled)

    explainer = lime.lime_tabular.LimeTabularExplainer(
        training_data=X_scaled,
        feature_names=colunas_treinadas,
        mode='classification',
        discretize_continuous=True,
        random_state=42
    )

    print("Calculando LIME + Probabilidades para cada embrião...")
    prob_euploidia = []

    for i in range(len(X_scaled)):
        _ = explainer.explain_instance(X_scaled[i], modelo.predict_proba, num_features=len(colunas_treinadas))
        prob = modelo.predict_proba(X_scaled[i].reshape(1, -1))[0][1]
        prob_euploidia.append(round(prob * 100, 2))

    df["Classe_Prevista"] = classes_preditas
    df["Prob_Euploidia_LIME"] = prob_euploidia

    
    output_file = "Planilha_Com_LIME_Porcentagem.xlsx"
    df.to_excel(output_file, index=False)

    print(f"\n Concluído com sucesso! Arquivo salvo como: {output_file}")
    
    # Retorna a lista com resultados para o frontend ou API
    results_list = []
    for idx, row in df.iterrows():
        embryo_id = row["embryoId"] if "embryoId" in df.columns else idx + 1  # começa do 1
        results_list.append({
            "embryoId": int(embryo_id),
            "ploidyStatus": "Euploide" if row["Classe_Prevista"] == 0 else "Aneuploide",
            "confidenceScore": row["Prob_Euploidia_LIME"]
        })

    return {"results": results_list}


if __name__ == "__main__":
    input_file = "PlanilhaNumerica.xlsx"
    df = pd.read_excel(input_file)
    rodar_predicao(df)