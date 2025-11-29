import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Copy, Check } from 'lucide-react'
import ToolsService from '../../../domain/services/toolsService'

export function TextTab() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTool, setSelectedTool] = useState('base64-encode')
  const [algorithm, setAlgorithm] = useState('sha256')
  const [caseType, setCaseType] = useState('uppercase')

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const processText = async () => {
    setLoading(true)
    setError('')
    try {
      let result
      switch (selectedTool) {
        case 'base64-encode':
          result = await ToolsService.base64Encode(input)
          break
        case 'base64-decode':
          result = await ToolsService.base64Decode(input)
          break
        case 'url-encode':
          result = await ToolsService.urlEncode(input)
          break
        case 'url-decode':
          result = await ToolsService.urlDecode(input)
          break
        case 'hash':
          result = await ToolsService.hash(input, algorithm)
          break
        case 'case-convert':
          result = await ToolsService.caseConvert(input, caseType)
          break
        case 'reverse':
          result = await ToolsService.reverseString(input)
          break
        case 'sort':
          result = await ToolsService.sortLines(input)
          break
        case 'unique':
          result = await ToolsService.uniqueLines(input)
          break
        case 'count':
          result = await ToolsService.countWords(input)
          setOutput(JSON.stringify(result, null, 2))
          setLoading(false)
          return
      }
      setOutput(result.result || result.html || '')
    } catch (err: any) {
      setError(err.error || err.message || 'Error processing text')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Select Tool</label>
          <Select value={selectedTool} onValueChange={setSelectedTool}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="base64-encode">Base64 Encode</SelectItem>
              <SelectItem value="base64-decode">Base64 Decode</SelectItem>
              <SelectItem value="url-encode">URL Encode</SelectItem>
              <SelectItem value="url-decode">URL Decode</SelectItem>
              <SelectItem value="hash">Hash Generator</SelectItem>
              <SelectItem value="case-convert">Case Converter</SelectItem>
              <SelectItem value="reverse">Reverse String</SelectItem>
              <SelectItem value="sort">Sort Lines</SelectItem>
              <SelectItem value="unique">Remove Duplicates</SelectItem>
              <SelectItem value="count">Word Count</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedTool === 'hash' && (
          <div>
            <label className="text-sm font-medium mb-2 block">Algorithm</label>
            <Select value={algorithm} onValueChange={setAlgorithm}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="md5">MD5</SelectItem>
                <SelectItem value="sha1">SHA-1</SelectItem>
                <SelectItem value="sha256">SHA-256</SelectItem>
                <SelectItem value="sha512">SHA-512</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedTool === 'case-convert' && (
          <div>
            <label className="text-sm font-medium mb-2 block">Case Type</label>
            <Select value={caseType} onValueChange={setCaseType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uppercase">UPPERCASE</SelectItem>
                <SelectItem value="lowercase">lowercase</SelectItem>
                <SelectItem value="titlecase">Title Case</SelectItem>
                <SelectItem value="camelcase">camelCase</SelectItem>
                <SelectItem value="pascalcase">PascalCase</SelectItem>
                <SelectItem value="snakecase">snake_case</SelectItem>
                <SelectItem value="kebabcase">kebab-case</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Input Text</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full min-h-[200px] p-3 rounded-md border bg-background"
          placeholder="Enter your text here..."
        />
      </div>

      <Button onClick={processText} disabled={loading || !input} className="w-full">
        {loading ? 'Processing...' : 'Process'}
      </Button>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      {output && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Output</label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <textarea
            value={output}
            readOnly
            className="w-full min-h-[200px] p-3 rounded-md border bg-muted font-mono text-sm"
          />
        </div>
      )}
    </div>
  )
}
