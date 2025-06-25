```
cd backend
python3 -m venv venv         # cria o ambiente virtual
source venv/bin/activate     # ativa o ambiente no Linux/macOS
```

```
uvicorn main:app --reload --port 8001
```