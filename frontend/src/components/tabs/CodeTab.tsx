import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Copy, Check } from 'lucide-react'
import ToolsService from '../../../domain/services/toolsService'

export function CodeTab() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTool, setSelectedTool] = useState('json-format')

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const processCode = async () => {
    setLoading(true)
    setError('')
    try {
      let result
      switch (selectedTool) {
        case 'json-format':
          result = await ToolsService.formatJson(input)
          break
        case 'json-minify':
          result = await ToolsService.minifyJson(input)
          break
        case 'json-to-yaml':
          result = await ToolsService.jsonToYaml(input)
          break
        case 'yaml-to-json':
          result = await ToolsService.yamlToJson(input)
          break
        case 'sql-format':
          result = await ToolsService.formatSql(input)
          break
        case 'html-encode':
          result = await ToolsService.htmlEncode(input)
          break
        case 'html-decode':
          result = await ToolsService.htmlDecode(input)
          break
        case 'css-minify':
          result = await ToolsService.minifyCss(input)
          break
        case 'js-minify':
          result = await ToolsService.minifyJs(input)
          break
      }
      setOutput(result.result || '')
    } catch (err: any) {
      setError(err.error || err.message || 'Error processing code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pt-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Select Tool</label>
        <Select value={selectedTool} onValueChange={setSelectedTool}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="json-format">JSON Format</SelectItem>
            <SelectItem value="json-minify">JSON Minify</SelectItem>
            <SelectItem value="json-to-yaml">JSON to YAML</SelectItem>
            <SelectItem value="yaml-to-json">YAML to JSON</SelectItem>
            <SelectItem value="sql-format">SQL Format</SelectItem>
            <SelectItem value="html-encode">HTML Encode</SelectItem>
            <SelectItem value="html-decode">HTML Decode</SelectItem>
            <SelectItem value="css-minify">CSS Minify</SelectItem>
            <SelectItem value="js-minify">JS Minify</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Input Code</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full min-h-[250px] p-3 rounded-md border bg-background font-mono text-sm"
          placeholder="Paste your code here..."
        />
      </div>

      <Button onClick={processCode} disabled={loading || !input} className="w-full">
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
            className="w-full min-h-[250px] p-3 rounded-md border bg-muted font-mono text-sm"
          />
        </div>
      )}
    </div>
  )
}
