'use client'

import * as React from "react"
import './App.css'
import SpeechRecognition from './components/SpeechRecognition'
import RealTimeTranslation from './components/RealTimeTranslation'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import DownloadIcon from '@mui/icons-material/Download'
import DeleteIcon from '@mui/icons-material/Delete'
import TranslateIcon from '@mui/icons-material/Translate'
import LanguageIcon from '@mui/icons-material/Language'
import MicIcon from '@mui/icons-material/Mic'

interface Message {
  id: number
  original: string
  translated: string
}

export default function DocTalk() {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [currentText, setCurrentText] = React.useState('')
  const [isRecording, setIsRecording] = React.useState(false)
  const [targetLanguage, setTargetLanguage] = React.useState('es')
  const [audioData, setAudioData] = React.useState<number[]>([])

  const handleTranscript = (transcript: string, audioFrequencyData: number[]) => {
    if (transcript.trim()) {
      setCurrentText(transcript)
      setAudioData(audioFrequencyData)
      setIsRecording(true)
      addMessage(transcript, '')
    }
  }

  const handleTranslation = (translatedText: string) => {
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1]
      if (lastMessage && !lastMessage.translated) {
        return [
          ...prev.slice(0, -1),
          { ...lastMessage, translated: translatedText }
        ]
      }
      return prev
    })
    setCurrentText('')
  }

  const addMessage = (original: string, translated: string) => {
    setMessages(prev => [...prev, { id: Date.now(), original, translated }])
  }

  const handleClear = () => {
    setMessages([])
    setCurrentText('')
  }

  const handleDownloadNotes = async () => {
    try {
      const notesText = messages
        .map(msg => `Original: ${msg.original}\nTranslation: ${msg.translated}\n\n`)
        .join('')
      
      const blob = new Blob([notesText], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'doctor-notes.txt'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading notes:', error)
    }
  }

  return (
    <div className="main">
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        padding: '1rem', 
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LanguageIcon style={{ color: '#1976d2' }} />
          <span style={{ fontWeight: 500 }}>DocTalk</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MicIcon 
            style={{ 
              color: isRecording ? '#4caf50' : '#9e9e9e',
              width: '20px',
              height: '20px'
            }} 
          />
          <span style={{ fontSize: '0.875rem', color: '#666' }}>
            Recording {isRecording ? 'active' : 'ready'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="screen">
        <div className="column one">
          <div style={{ marginBottom: '1rem', color: '#1976d2', fontWeight: 500 }}>
            English
          </div>
          <div className="scroll-area">
            {messages.map((message) => (
              <div key={message.id} className="message">
                {message.original}
              </div>
            ))}
          </div>
        </div>
        
        <div className="column column2" />
        
        <div className="column three">
          <div style={{ marginBottom: '1rem', color: '#1976d2', fontWeight: 500 }}>
            Translation
          </div>
          <div className="scroll-area">
            {messages.map((message) => (
              <div key={message.id} className="message">
                {message.translated}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="button-section">
        <Button
          variant="contained"
          className="docNotes"
          startIcon={<DownloadIcon />}
          onClick={handleDownloadNotes}
        >
          Doctor Notes
        </Button>
        <Button
          variant="contained"
          className="clear"
          startIcon={<DeleteIcon />}
          onClick={handleClear}
        >
          Clear
        </Button>
        <Select
          value={targetLanguage}
          className="language"
          onChange={(e) => setTargetLanguage(e.target.value)}
          startAdornment={<TranslateIcon style={{ marginRight: '8px' }} />}
        >
          <MenuItem value="es">Spanish</MenuItem>
          <MenuItem value="fr">French</MenuItem>
          <MenuItem value="de">German</MenuItem>
        </Select>
      </div>

      <SpeechRecognition onTranscript={handleTranscript} />
      {currentText && (
        <RealTimeTranslation 
          text={currentText}
          targetLanguage={targetLanguage}
          onTranslated={handleTranslation}
        />
      )}
    </div>
  )
}