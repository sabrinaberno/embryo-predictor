export async function uploadFileToPredictionAPI(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"

  const response = await fetch(`${apiUrl}/predict`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Erro ao enviar para a API de predição")
  }

  const data = await response.json()
  return data.results
}