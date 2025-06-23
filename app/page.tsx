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
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      if (jsonData.length === 0) {
        setValidationErrors(["O arquivo está vazio."])
        setIsProcessing(false)
        return
      }

      const headers = jsonData[0] as string[]
      const dataRows = jsonData.slice(1)

      // Validate headers
      const errors = validateHeaders(headers)
      if (errors.length > 0) {
        setValidationErrors(errors)
        setIsProcessing(false)
        return
      }

      // Validate data
      const dataValidationErrors = validateData(dataRows, headers)
      if (dataValidationErrors.length > 0) {
        setValidationErrors(dataValidationErrors)
        setIsProcessing(false)
        return
      }

      // Convert to objects for easier handling
      const processedData = dataRows.map((row: any[]) => {
        const obj: any = {}
        headers.forEach((header, index) => {
          obj[header] = row[index]
        })
        return obj
      })

      setFileData(processedData)
      setUploadSuccess(true)
      setIsProcessing(false)
    } catch (error) {
      setValidationErrors(["Error processing file. Please check the file format and try again."])
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
      errors.push("No data rows found in the file.")
      return errors
    }

    // Check for empty rows
    const emptyRows = dataRows.filter(
      (row, index) => !row || row.every((cell) => cell === null || cell === undefined || cell === ""),
    )

    if (emptyRows.length === dataRows.length) {
      errors.push("All data rows appear to be empty.")
    }

    // Validate numeric columns
    const numericColumns = ["t2", "t3", "t4", "t5", "t8", "tSC", "tSB", "tB"]
    dataRows.forEach((row, rowIndex) => {
      headers.forEach((header, colIndex) => {
        if (numericColumns.includes(header) && row[colIndex] !== null && row[colIndex] !== undefined) {
          const value = row[colIndex]
          if (isNaN(Number(value))) {
            errors.push(`Row ${rowIndex + 2}: "${header}" should be a number, got "${value}"`)
          }
        }
      })
    })

    // Limit validation errors to prevent overwhelming the user
    return errors.slice(0, 10)
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await processFile(file)
    }
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
              className="absolute inset-0 bg-cover bg-center opacity-15 transform scale-x-110"
              style={{
                backgroundImage: "url('/images/azuleijo.jpg')",
              }}
            ></div>
        
        <div className="max-w-4xl mx-auto text-center relative">
          {/* <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="w-64 h-64 bg-green-600 rounded-full opacity-30"></div>
          </div> */}
          

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
          <h2 className="text-3xl font-bold mb-6">Sobre o Projeto</h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            Esta ferramenta utiliza algoritmos avançados de aprendizado de máquina para prever a ploidia do embrião com base em dados morfocinéticos. Desenvolvida por pesquisadores da Universidade de Brasília, ela visa melhorar as taxas de sucesso da fertilização in vitro (FIV), fornecendo aos médicos informações valiosas sobre a viabilidade do embrião. Nossa abordagem integra tecnologia de ponta com metodologia científica rigorosa para fornecer previsões precisas e confiáveis.
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
                    src="/images/sabrina-fundo.png"
                    alt="Sabrina"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-lg">Prof. Dr. George Marcicano</h3>
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
                    src="/images/maria.jpeg"
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
                Idade, Estágio, Morfo, t2, t3, t4, t5, t8, tSC, tSB, tB, cc2 (t3-t2), cc3 (t5-t3), t5-t2, s2 (t4-t3), s3
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
                    <h3 className="text-xl font-semibold mb-2">Processing file...</h3>
                    <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : uploadSuccess ? (
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-green-700">File uploaded successfully!</h3>
                    <p className="text-green-600 mb-4">{uploadedFile?.name}</p>
                    <p className="text-sm text-gray-600">{fileData.length} rows processed</p>
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
                <h3 className="text-xl font-semibold mb-4">Data Preview</h3>
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
                            ... +{Object.keys(fileData[0]).length - 8} more
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
                    <p className="text-sm text-gray-600 mt-2">Showing first 5 rows of {fileData.length} total rows</p>
                  )}
                </div>

                <div className="mt-4 flex gap-4">
                  <Button className="bg-green-700 hover:bg-green-800" onClick={() => router.push("/results")}>
                    Run Prediction Analysis
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
                    Upload New File
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
            Para perguntas e suporte, entre em contato conosco em{" "}
            <a href="mailto:embryopredictor@unb.br" className="text-green-700 hover:underline">
              email
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
