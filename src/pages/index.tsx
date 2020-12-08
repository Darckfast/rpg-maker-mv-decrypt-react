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
  const [filesDecrypted, setFilesDecrypted] = useState(0)
  const [progress, setProgress] = useState(0)
  const [removePath, setRemovePath] = useState(false)
  const [includeAudio, setIncludeAudio] = useState(true)
  const [includeVideo, setIncludeVideo] = useState(true)
  const [includeImage, setIncludeImage] = useState(true)
  const [progressStatus, setProgressStatus] = useState('')
  let encryptKey = ''

  function handleFiles(e: FileList): void {
    console.log(removePath, includeAudio, includeImage, includeVideo)
    setProgress(0)
    setProgressStatus('ready')
    if (e) {
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
      const toIncrement = 2 + 10 / lastIndex
      const zip = new JSZip()
      let totalDecrypted = 0

      files.forEach((file: File1, index) => {
        if (
          (file.webkitRelativePath.endsWith('rpgmvp') && !includeImage) ||
          (file.webkitRelativePath.endsWith('rpgmvm') && !includeAudio) ||
          (file.webkitRelativePath.endsWith('rpgmvo') && !includeVideo)
        ) {
          return
        }

        const reader = new FileReader()

        reader.onload = e => {
          let fileName: string = file.webkitRelativePath
            .replace(/.(rpgmvp)$/, '.png')
            .replace(/.(rpgmvm)$/, '.m4a')
            .replace(/.(rpgmvo)$/, '.ogg')

          if (removePath) {
            fileName = fileName.split('/')[fileName.split('/').length - 1]
          }

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

          setFilesDecrypted(++totalDecrypted)
          setProgressStatus('decrypting')

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

        reader.onprogress = () => {
          setProgress(progress + toIncrement)
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
              <span>Select www dir</span>
            </InputLabel>
            <Button type="submit" disabled={files.length === 0}>
              <span>Decrypt</span>
            </Button>

            <div>files found: {files.length}</div>
            <div>files decrypted: {filesDecrypted}</div>
            <ProgressBar>
              <Filler style={{ width: `${progress}%` }}>
                <ProgressStatus>{progressStatus}</ProgressStatus>
              </Filler>
            </ProgressBar>

            <CheckBox
              label="Remove path"
              value={removePath}
              onChangeValue={e => setRemovePath(e.target.checked)}
            ></CheckBox>
            <CheckBox
              label="Decrypt audio"
              value={includeAudio}
              onChangeValue={e => setIncludeAudio(e.target.checked)}
            ></CheckBox>
            <CheckBox
              label="Decrypt video"
              value={includeVideo}
              onChangeValue={e => setIncludeVideo(e.target.checked)}
            ></CheckBox>
            <CheckBox
              label="Decrypt image"
              value={includeImage}
              onChangeValue={e => setIncludeImage(e.target.checked)}
            ></CheckBox>
          </form>
        </div>
      </main>
    </Container>
  )
}

export default Home
