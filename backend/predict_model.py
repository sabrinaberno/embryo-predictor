# predict_model.py
import pandas as pd
import joblib
import numpy as np
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score, confusion_matrix, classification_report, roc_curve
import matplotlib.pyplot as plt
import seaborn as sns
import lime
import lime.lime_tabular

def rodar_predicao(df: pd.DataFrame):
    modelo = joblib.load("backend/mlp_model.pkl")
    scaler = joblib.load("backend/scaler.pkl")

    X = df.drop(columns=["Ploidia"], errors="ignore")
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

    prob_euploidia = []

    for i in range(len(X_scaled)):
        _ = explainer.explain_instance(X_scaled[i], modelo.predict_proba, num_features=len(colunas_treinadas))
        
        prob = modelo.predict_proba(X_scaled[i].reshape(1, -1))[0][1]
        prob_euploidia.append(round(prob * 100, 2))

    df["Classe_Prevista"] = classes_preditas
    df["Prob_Euploidia_%"] = prob_euploidia

    prob_raw = modelo.predict_proba(X_scaled)[:, 1]
    acc = accuracy_score(y_true, classes_preditas)
    auc = roc_auc_score(y_true, prob_raw)

    cm = confusion_matrix(y_true, classes_preditas)
    tn, fp, fn, tp = cm.ravel()
    recall_euploide = tp / (tp + fn) if (tp + fn) > 0 else 0
    recall_aneuploide = tn / (tn + fp) if (tn + fp) > 0 else 0

    print("\n=== MÉTRICAS DE DESEMPENHO ===")
    print(f"Acurácia: {acc:.3f}")
    print(f"AUC (baseado na sigmoid): {auc:.3f}")
    print(f"Recall Euploide (Sensibilidade): {recall_euploide:.3f}")
    print(f"Recall Aneuploide (Especificidade): {recall_aneuploide:.3f}")
    print("\n=== Classification Report ===")
    print(classification_report(y_true, classes_preditas))

    output_file = "Planilha_Com_LIME_Porcentagem.xlsx"
    df.to_excel(output_file, index=False)

    # Retorna a lista com resultados para o frontend ou API
    results_list = []
    for idx, row in df.iterrows():
        embryo_id = row["embryoId"] if "embryoId" in df.columns else idx + 1  # começa do 1
        results_list.append({
            "embryoId": int(embryo_id),
            "ploidyStatus": "Euploide" if row["Classe_Prevista"] == 1 else "Aneuploide",
            "confidenceScore": row["Prob_Euploidia_%"]
        })

    return {"results": results_list}


if __name__ == "__main__":
    input_file = "PlanilhaNumerica.xlsx"
    df = pd.read_excel(input_file)
    rodar_predicao(df)