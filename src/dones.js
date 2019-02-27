const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const mkdirp = require('mkdirp')
const clipboard = require('clipboardy')
const { getToday, getYesterday, readFile, writeFile } = require('./utils')
const config = require('./config')

const dirName = 'dones'

exports.getDir = async () => {
  const dirRoot = await config.getDirectory()
  const dir = path.join(dirRoot, dirName)

  if (!fs.existsSync(dir)) {
    mkdirp.sync(dir)
  }

  return dir
}

exports.existsFromDate = async date => {
  const filePath = await exports.getFilePath(date)

  return fs.existsSync(filePath)
}

exports.getFilePath = async date => {
  const file = `${date}.md`
  const dir = await exports.getDir()
  const filePath = path.join(dir, file)

  return filePath
}

exports.readFile = async date => {
  const filePath = await exports.getFilePath(date)
  if (!fs.existsSync(filePath)) {
    return ''
  }

  return readFile(filePath)
}

exports.add = async content => {
  const date = getToday()
  const filePath = await exports.getFilePath(date)
  const previousContent = exports.getFileContent(filePath)

  const nextContent = previousContent
    ? `${previousContent}\n${content}`
    : content

  await writeFile(filePath, nextContent)

  return nextContent
}

exports.getContentForDay = async ({ date, day, showEmpty }) => {
  const filePath = await exports.getFilePath(date)

  const emptyMessage = 'No tasks added yet!'
  const content = await exports.getFileContent(filePath)

  if (!showEmpty && !content) return ''

  return `*${day} (${date})*\n\n${content || emptyMessage}`
}

exports.getToday = async () => {
  return exports.getContentForDay({
    date: getToday(),
    day: 'Today',
    showEmpty: true,
  })
}

exports.getYesterday = async () => {
  return exports.getContentForDay({
    date: getYesterday(),
    day: 'Yesterday',
    showEmpty: true,
  })
}

exports.editToday = async () => {
  const date = getToday()
  const filePath = await exports.getFilePath(date)
  const editor = await config.getEditor()

  console.log('Opening', filePath, 'with', editor)
  const task = spawn(editor, [filePath], { stdio: 'inherit' })

  task.on('exit', () => {
    console.log('Done editing!')
  })
}

exports.print = async () => {
  const yesteday = await exports.getYesterday()
  const today = await exports.getToday()

  return `${yesteday}\n\n${today}`
}

exports.copyAndPrint = async () => {
  const content = await exports.print()
  clipboard.writeSync(content)

  return content
}

exports.getFileContent = async filePath => {
  let content = ''

  if (fs.existsSync(filePath)) {
    content = await readFile(filePath)
  }

  return content
}

exports.dirName = dirName