import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Copy, Check, RefreshCw } from 'lucide-react'
import ToolsService from '../../../domain/services/toolsService'

export function OtherTab() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedTool, setSelectedTool] = useState('uuid')
  const [uuidCount, setUuidCount] = useState(1)
  const [randomLength, setRandomLength] = useState(16)
  const [fromBase, setFromBase] = useState(10)
  const [toBase, setToBase] = useState(16)

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const processTool = async () => {
    setLoading(true)
    try {
      let result
      switch (selectedTool) {
        case 'uuid':
          result = await ToolsService.generateUuid(uuidCount)
          setOutput(result.uuids.join('\n'))
          break
        case 'random-string':
          result = await ToolsService.generateRandomString({ length: randomLength })
          setOutput(result.result)
          break
        case 'timestamp-now':
          result = await ToolsService.getCurrentTimestamp()
          setOutput(JSON.stringify(result, null, 2))
          break
        case 'timestamp-to-date':
          result = await ToolsService.timestampToDate(parseInt(input))
          setOutput(JSON.stringify(result, null, 2))
          break
        case 'date-to-timestamp':
          result = await ToolsService.dateToTimestamp(input)
          setOutput(result.timestamp.toString())
          break
        case 'base-convert':
          result = await ToolsService.convertBase(input, fromBase, toBase)
          setOutput(result.result)
          break
      }
    } catch (err: any) {
      setOutput(`Error: ${err.error || err.message || 'Unknown error'}`)
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
            <SelectItem value="uuid">UUID Generator</SelectItem>
            <SelectItem value="random-string">Random String</SelectItem>
            <SelectItem value="timestamp-now">Current Timestamp</SelectItem>
            <SelectItem value="timestamp-to-date">Timestamp to Date</SelectItem>
            <SelectItem value="date-to-timestamp">Date to Timestamp</SelectItem>
            <SelectItem value="base-convert">Number Base Converter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedTool === 'uuid' && (
        <div>
          <label className="text-sm font-medium mb-2 block">Count</label>
          <Input
            type="number"
            value={uuidCount}
            onChange={(e) => setUuidCount(parseInt(e.target.value))}
            min={1}
            max={100}
          />
        </div>
      )}

      {selectedTool === 'random-string' && (
        <div>
          <label className="text-sm font-medium mb-2 block">Length</label>
          <Input
            type="number"
            value={randomLength}
            onChange={(e) => setRandomLength(parseInt(e.target.value))}
            min={1}
            max={1000}
          />
        </div>
      )}

      {selectedTool === 'base-convert' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">From Base</label>
            <Select value={fromBase.toString()} onValueChange={(v) => setFromBase(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">Binary (2)</SelectItem>
                <SelectItem value="8">Octal (8)</SelectItem>
                <SelectItem value="10">Decimal (10)</SelectItem>
                <SelectItem value="16">Hex (16)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">To Base</label>
            <Select value={toBase.toString()} onValueChange={(v) => setToBase(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">Binary (2)</SelectItem>
                <SelectItem value="8">Octal (8)</SelectItem>
                <SelectItem value="10">Decimal (10)</SelectItem>
                <SelectItem value="16">Hex (16)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {!['uuid', 'random-string', 'timestamp-now'].includes(selectedTool) && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Input</label>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={selectedTool === 'timestamp-to-date' ? 'Enter Unix timestamp' :
                        selectedTool === 'date-to-timestamp' ? 'Enter date (YYYY-MM-DD or ISO)' :
                        'Enter number'}
          />
        </div>
      )}

      <Button onClick={processTool} disabled={loading} className="w-full gap-2">
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Generating...' : 'Generate'}
      </Button>

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
