export async function uploadFileToPredictionAPI(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("http://localhost:8001/predict", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Erro ao enviar para a API de predição")
  }

  const data = await response.json()
  return data.results // [{ embryoId, ploidyStatus, confidenceScore }]
}