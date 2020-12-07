import React, { FormEvent, useState } from 'react'
import Head from 'next/head'
import {
  Button,
  Container,
  Filler,
  InputLabel,
  ProgressBar,
  ProgressStatus
} from '../styles/pages/Home'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import CheckBox from '../components/Checkbox'

interface File1 extends File {
  webkitRelativePath?: string
}

const Home: React.FC = () => {
  const [system, setSystem] = useState([])
  const [files, setFiles] = useState([])
  const [progress, setProgress] = useState(0.0)
  const [removePath, setRemovePath] = useState('false')
  const [includeAudio] = useState('true')
  const [includeVideo] = useState('true')
  const [includeImage] = useState('true')
  const [progressStatus, setProgressStatus] = useState('')
  let encryptKey = ''

  function handleFiles(e: FileList): void {
    console.log(removePath, includeAudio, includeImage, includeVideo)
    setProgress(0)
    setProgressStatus('ready')
    if (e) {
      console.log(files.length)
      const filesArray = Array.from(e)

      setFiles(filesArray.filter((file: File) => file.name.endsWith('.rpgmvp')))
      setSystem(filesArray.filter((file: File) => file.name === 'System.json'))
    }
  }

  function decryptFiles() {
    if (files.length > 0) {
      setProgress(1)
      setProgressStatus('reading')

      const blobs = []
      const lastIndex = files.length - 1
      const toIncrement = 1 + 9 / lastIndex
      const zip = new JSZip()

      files.forEach((file: File1 , index) => {
        if ((file.webkitRelativePath.endsWith('rpgmvp') && includeImage === 'false')
        || (file.webkitRelativePath.endsWith('rpgmvm') && includeAudio === 'false')
        || (file.webkitRelativePath.endsWith('rpgmvo') && includeVideo === 'false')) {
            return;
        }

        const reader = new FileReader()

        reader.onload = e => {
          let fileName: string = file.webkitRelativePath
            .replace(/.(rpgmvp)$/, '.png')
            .replace(/.(rpgmvm)$/, '.m4a')
            .replace(/.(rpgmvo)$/, '.ogg')

          if (removePath === 'true') {
            console.log(fileName)
            fileName = fileName.split('/')[fileName.split('/').length - 1]
            console.log(fileName)
          }

          setProgressStatus('decrypting')
          setProgress(progress + toIncrement)

          let arrayBuffer: ArrayBuffer = e.target.result as ArrayBuffer

          arrayBuffer = arrayBuffer.slice(16, arrayBuffer.byteLength)

          const view = new DataView(arrayBuffer)
          const parsedKey = encryptKey.split(/(.{2})/).filter(Boolean)
          const byteArray = new Uint8Array(arrayBuffer)

          for (let i = 0; i < 16; i++) {
            byteArray[i] = byteArray[i] ^ parseInt(parsedKey[i], 16)
            view.setUint8(i, byteArray[i])
          }

          zip.file(fileName, new Blob([arrayBuffer]))

          if (index === lastIndex) {
            setProgressStatus('zipping')

            console.log('done, zipping files', blobs.length, progress)

            zip
              .generateAsync({ type: 'blob', streamFiles: true }, metadata => {
                const prog = metadata.percent - progress
                if (prog > 0) {
                  setProgress(progress + prog)
                }
              })
              .then(content => {
                saveAs(content, 'Extract.zip')
              })
              .finally(() => {
                setProgress(0)
                setProgressStatus('completed')
              })
            }
          }
        reader.readAsArrayBuffer(file)
      })
    }
  }

  function submitFiles(e: FormEvent): void {
    e.preventDefault()
    findEncryptionCode()
  }

  function findEncryptionCode(): void {
    const reader = new FileReader()

    reader.onload = e => {
      const content = JSON.parse(e.target.result.toString())

      for (const key in content) {
        if (Object.prototype.hasOwnProperty.call(content, key)) {
          const element = content[key]

          if (/^[a-f0-9]{32}$/i.test(element)) {
            encryptKey = element
            break
          }
        }
      }

      decryptFiles()
    }

    reader.readAsText(system[0])
  }

  function test(e: any) {
    console.log(e.target.value)
  }

  return (
    <Container>
      <Head>
        <title>Create Next App</title>
      </Head>

      <main>
        <h1>RPG Maker MV decrypt</h1>

        <div>
          <form onSubmit={submitFiles}>
            <input
              style={{ display: 'none' }}
              id="fileUpload"
              type="file"
              {...{ webkitdirectory: '', mozdirectory: '', directory: '' }}
              onChange={e => handleFiles(e.target.files)}
              accept=".json,.rpgmvp,.rpgmvm,.rpgmvo"
            />
            <InputLabel htmlFor="fileUpload">
              <span>Select www/ dir</span>
            </InputLabel>
            <Button type="submit" disabled={files.length === 0}>
              <span>Decrypt</span>
            </Button>

            <div>files: {files.length}</div>
            <ProgressBar>
              <Filler style={{ width: `${progress}%` }}>
                <ProgressStatus>{progressStatus}</ProgressStatus>
              </Filler>
            </ProgressBar>

            <CheckBox label="Remove path" value={removePath} onChangeValue={e => test(e)}></CheckBox>
            <CheckBox label="Do not decrypt audio" value={includeAudio}></CheckBox>
            <CheckBox label="Do not decrypt video" value={includeVideo}></CheckBox>
            <CheckBox label="Do not decrypt image" value={includeImage}></CheckBox>

          </form>
        </div>
      </main>
    </Container>
  )
}

export default Home
