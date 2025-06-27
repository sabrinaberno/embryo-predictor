"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload } from "lucide-react"
import * as XLSX from "xlsx"
import { useRouter } from "next/navigation"

export default function EmbryoPredictorPage() {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileData, setFileData] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const router = useRouter()

  const requiredHeaders = [
    "Idade",
    "Estágio",
    "Morfo",
    "t2",
    "t3",
    "t4",
    "t5",
    "t8",
    "tSC",
    "tSB",
    "tB",
    "cc2 (t3-t2)",
    "cc3 (t5-t3)",
    "t5-t2",
    "s2 (t4-t3)",
    "s3 (t8-t5)",
    "tSC-t8",
    "tB-tSB",
  ]

  type AnalysisResult = {
    embryoId: number
    ploidyStatus: string
    confidenceScore: number
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await processFile(files[0])
    }
  }

  const processFile = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setValidationErrors(["Por favor, carregue um arquivo XLSX apenas."])
      return
    }

    setIsProcessing(true)
    setValidationErrors([])
    setUploadSuccess(false)
    setUploadedFile(file)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number | null)[][]

      if (!jsonData || jsonData.length === 0) {
        setValidationErrors(["O arquivo está vazio."])
        setUploadSuccess(false)
        setIsProcessing(false)
        return
      }

      const headers = jsonData[0] as string[]
      const dataRows = jsonData.slice(1)

      // Validate headers
      const errors = validateHeaders(headers)
      if (errors.length > 0) {
        setValidationErrors(errors)
        setUploadSuccess(false)
        setIsProcessing(false)
        return
      }

      // Validate data
      const dataValidationErrors = validateData(dataRows, headers)
      if (dataValidationErrors.length > 0) {
        setValidationErrors(dataValidationErrors)
        setUploadSuccess(false)
        setIsProcessing(false)
        return
      }

      // Convert to objects for easier handling
      const processedData = dataRows.map((row: any[] = []) => {
        const obj: any = {}
        headers.forEach((header, index) => {
          obj[header] = row?.[index] ?? ""
        })
        return obj
      })

      setFileData(processedData)
      setUploadSuccess(true)
      setIsProcessing(false)

    } catch (error: any) {

      console.error("Erro inesperado ao processar o arquivo:", error)
      setValidationErrors(["Ocorreu um erro ao processar o arquivo. Por favor, verifique o formato do arquivo e tente novamente."])
      setUploadSuccess(false)
      setIsProcessing(false)
    }
  }

  const validateHeaders = (headers: string[]): string[] => {
    const errors: string[] = []
    const missingHeaders = requiredHeaders.filter(
      (required) => !headers.some((header) => header.trim().toLowerCase() === required.toLowerCase()),
    )

    if (missingHeaders.length > 0) {
      errors.push(`Faltando as colunas obrigatórias: ${missingHeaders.join(", ")}`)
    }

    return errors
  }

  const validateData = (dataRows: any[][], headers: string[]): string[] => {
    const errors: string[] = []

    if (dataRows.length === 0) {
      errors.push("Nenhuma linha de dados encontrada no arquivo.")
      return errors
    }

    // Verifica se todas as linhas estão vazias
    const emptyRows = dataRows.filter(
      (row) => !row || row.every((cell) => cell === null || cell === undefined || cell === ""),
    )

    if (emptyRows.length === dataRows.length) {
      errors.push("Todas as linhas de dados estão vazias.")
    }

    dataRows.forEach((row, rowIndex) => {
      for (let i = 0; i < headers.length; i++) {
        if (row[i] === undefined || row[i] === null || row[i] === "") {
          errors.push(`A célula da coluna "${headers[i]}" na linha ${rowIndex + 2} está vazia.`)
        }
      }
    })


    dataRows.forEach((row, rowIndex) => {
      const hasAnyValue = row.some((cell) => cell !== null && cell !== undefined && cell !== "")
      const hasAnyBlank = row.some((cell) => cell === null || cell === undefined || cell === "")

      if (hasAnyValue && hasAnyBlank) {
        errors.push(`A linha ${rowIndex + 2} contém campos em branco. A planilha não pode conter valores em branco.`)
      }
    })

    return errors
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await processFile(file)
    }
  }

  const sendToAPI = async (file: File): Promise<AnalysisResult[]> => {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch("http://localhost:8001/predict", {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error("Erro da API:", errorText)
    throw new Error("Erro ao enviar a planilha para a API")
  }

  const data = await res.json()

  if (!Array.isArray(data.results)) {
    console.error("Formato de resposta inesperado:", data)
    throw new Error("A API não retornou uma lista de resultados.")
  }

  return data.results as AnalysisResult[]
}



  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <img
            src="/images/feto.png"
            alt="Ícone de embrião"
            className="w-6 h-6 object-contain"
          />
          <span className="font-semibold text-lg">Preditor de Embriões</span>
        </div>
        <nav className="flex gap-6 items-center">
          <a href="#about" className="text-gray-600 hover:text-gray-900">
            Sobre
          </a>
          <a href="#upload" className="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200">
            Carregar Dados
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-200 to-gray-300 py-20 px-6 ">
        <div
              className="absolute inset-0 bg-cover bg-center opacity-15 transform"
              style={{
                backgroundImage: "url('/images/azuleijo.png')",
              }}
            ></div>
        
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="relative z-10">
            <h1 className="text-5xl font-bold text-[#003366] mb-4">Ferramenta de Predição de Ploidia de Embriões</h1>
            <p className="text-xl text-[#003366] mb-8 max-w-2xl mx-auto">
              Insira dados morfocinéticos do embrião e receba uma análise preditiva impulsionada por IA.
            </p>
            <a href="#upload" className="bg-green-700 hover:bg-green-800 text-white px-8 py-3 rounded-lg">
              Carregar Dados
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-[#003366] ">Sobre o Projeto</h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            Esta ferramenta utiliza algoritmos avançados de inteligência artificial para prever a ploidia do embrião com uma precisão superior a 88%, com base em dados morfocinéticos e morfológicos. Desenvolvida por pesquisadoras da Universidade de Brasília, ela auxilia na seleção dos embriões com maior potencial de implantação, aumentando as taxas de sucesso da fertilização in vitro (FIV). Além de classificar o embrião como euploide ou aneuploide, nossa solução oferece a porcentagem dessa predição, trazendo maior segurança e precisão às decisões clínicas, reduzindo custos, otimizando os resultados da medicina reprodutiva e sendo uma alternativa menos invasiva ao PGT-A.
          </p>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-300">
                  <Image
                    src="/images/george.jpeg"
                    alt="George"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-lg">Prof. Dr. George Marsicano </h3>
                <p className="text-gray-600">Professor orientador da UnB</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-300">
                  <Image
                    src="/images/sabrina.png"
                    alt="Sabrina"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover scale-125"
                  />
                </div>
                <h3 className="font-semibold text-lg">Sabrina Caldas Berno</h3>
                <p className="text-gray-600">Analista de Dados</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-300">
                  <Image
                    src="/images/maria.jpeg"
                    alt="Maria"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-lg">Maria Eduarda Abritta</h3>
                <p className="text-gray-600">Analista de Dados</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-300">
                  <Image
                    src="/images/bruno.png"
                    alt="Dr. Bruno"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-lg">Dr. Bruno Ramalho</h3>
                <p className="text-gray-600">Médico ginecologista e especialista em Reprodução Humana</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Data Upload Section */}
      <section id="upload" className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Required Headers */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Cabeçalhos de Coluna Obrigatórios</h3>
              <p className="text-sm text-gray-700 mb-4 font-mono bg-gray-100 p-3 rounded">
                ID, Idade, Estágio, Kidscore, Morfo, t2, t3, t4, t5, t8, tSC, tSB, tB, cc2 (t3-t2), cc3 (t5-t3), t5-t2, s2 (t4-t3), s3
                (t8-t5), tSC-t8, tB-tSB
              </p>
              <p className="text-gray-600">
                Certifique-se de que seus dados estejam em conformidade com o formato especificado.
              </p>
            </CardContent>
          </Card>

          <h2 className="mt-12 text-3xl font-bold mb-8 text-center">Carregar Dados</h2>

          {/* Upload Area */}
          <Card className="mt-8">
            <CardContent className="p-10">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragActive
                    ? "border-green-500 bg-green-50"
                    : uploadSuccess
                      ? "border-green-500 bg-green-50"
                      : validationErrors.length > 0
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload
                  className={`w-12 h-12 mx-auto mb-4 ${
                    uploadSuccess ? "text-green-500" : validationErrors.length > 0 ? "text-red-500" : "text-gray-400"
                  }`}
                />

                {isProcessing ? (
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Processando Arquivo...</h3>
                    <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : uploadSuccess ? (
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-green-700">Arquivo Enviado com Sucesso!</h3>
                    <p className="text-green-600 mb-4">{uploadedFile?.name}</p>
                    <p className="text-sm text-gray-600">{fileData.length} linhas processadas</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Arraste e solte seu arquivo de dados aqui</h3>
                    <p className="text-gray-600 mb-4">Formatos suportados: apenas XLSX</p>
                    <input type="file" accept=".xlsx" onChange={handleFileInput} className="hidden" id="file-input" />
                    <label htmlFor="file-input">
                      <Button variant="outline" className="mb-4 cursor-pointer" asChild>
                        <span>Procurar Arquivos</span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">Validação de erros:</h4>
                  <ul className="list-disc list-inside text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-sm">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Preview */}
          {uploadSuccess && fileData.length > 0 && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Prévia dos Dados</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        {Object.keys(fileData[0])
                          .slice(0, 8)
                          .map((header) => (
                            <th key={header} className="border border-gray-300 px-3 py-2 text-left font-medium">
                              {header}
                            </th>
                          ))}
                        {Object.keys(fileData[0]).length > 8 && (
                          <th className="border border-gray-300 px-3 py-2 text-left font-medium">
                            ... +{Object.keys(fileData[0]).length - 8} mais
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {fileData.slice(0, 5).map((row, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          {Object.values(row)
                            .slice(0, 8)
                            .map((value: any, cellIndex) => (
                              <td key={cellIndex} className="border border-gray-300 px-3 py-2">
                                {value?.toString() || "-"}
                              </td>
                            ))}
                          {Object.values(row).length > 8 && (
                            <td className="border border-gray-300 px-3 py-2 text-gray-500">...</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {fileData.length > 5 && (
                    <p className="text-sm text-gray-600 mt-2">Exibindo as primeiras 5 linhas de um total de {fileData.length} linhas de dados</p>
                  )}
                </div>

                <div className="mt-4 flex gap-4">
                  <Button
                    className="bg-green-700 hover:bg-green-800"
                    onClick={async () => {
                      if (!uploadedFile) return
                      setIsProcessing(true)
                      try {
                        const apiResults = await sendToAPI(uploadedFile)
                        localStorage.setItem("embryoResults", JSON.stringify(apiResults))
                        router.push("/results")
                      } catch (error) {
                        console.error(error)
                        alert("Erro ao processar os dados. Verifique sua planilha.")
                      } finally {
                        setIsProcessing(false)
                      }
                    }}
                  >
                    Rodar Análise de Predição
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFileData([])
                      setUploadedFile(null)
                      setUploadSuccess(false)
                      setValidationErrors([])
                    }}
                  >
                    Upload de um novo arquivo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <p className="text-gray-600 mb-6">
            Aceitamos arquivos .xlsx. Após o upload, os resultados serão exibidos abaixo.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Contato</h2>
          <p className="text-gray-700 text-lg">
            Para perguntas e suporte, entre em contato conosco em {" "} 
            <a href="sabrinacberno@gmail.com" className="text-green-700 hover:underline">
              sabrinacberno@gmail.com
            </a>
            {" "}ou{" "} 
            <a href="eduardaabritta@gmail.com" className="text-green-700 hover:underline">
              eduardaabritta@gmail.com
            </a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t text-center text-gray-600">
        <p>© 2024 University of Brasília. All rights reserved.</p>
      </footer>
    </div>
  )
}
