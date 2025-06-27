# predict_model.py
import pandas as pd
import joblib
import numpy as np
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score

def rodar_predicao(df: pd.DataFrame):
    # mlp = joblib.load("backend/melhor_modelo_mlp_20250610_113659.pkl")
    # scaler = joblib.load("backend/scaler_mlp_20250610_113659.pkl")
    mlp = joblib.load("backend/mlp_model.pkl")
    scaler = joblib.load("backend/scaler.pkl")

    # Verificar se tem coluna Ploidia
    tem_rotulo = "Ploidia" in df.columns

    # Separar X e y se possível
    if tem_rotulo:
        X = df.drop(columns=["Ploidia"])
        y_true = df["Ploidia"].values
    else:
        X = df.copy()
        y_true = None  

    # Aplicar scaler
    X_scaled = scaler.transform(X)

    # Prever classes e probabilidades
    classes_pred = mlp.predict(X_scaled)
    probs = mlp.predict_proba(X_scaled)[:, 1]

    df["Classe_Prevista"] = classes_pred
    df["Prob_Euploidia_%"] = np.round(probs * 100, 2)

    # Exibir métricas, se possível
    if tem_rotulo:
        print("\nAvaliação da predição:")
        acc = accuracy_score(y_true, classes_pred)
        print(f"Accuracy: {acc:.3f}")
        print("\nClassification Report:")
        print(classification_report(y_true, classes_pred))
        auc = roc_auc_score(y_true, probs)
        print(f"AUC: {auc:.3f}")
    else:
        print("Coluna 'Ploidia' não encontrada — apenas predição realizada.")
        
    
    output_file = "Planilha_Com_LIME_Porcentagem.xlsx"
    df.to_excel(output_file, index=False)

    print(f"\n Concluído com sucesso! Arquivo salvo como: {output_file}")
    
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