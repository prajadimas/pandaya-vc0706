const path = require('path')
const jimp = require('jimp')
const SerialPort = require('serialport')

function sendSync(serialPort, src, length) {
	return new Promise((resolve, reject) => {
		serialPort.write(src);
		const ByteLength = require('@serialport/parser-byte-length')
		if (!length) {
			serialPort.once('data', (data) => {
				// console.log('Data: ', data)
				resolve(data)
			})
			serialPort.once('error', (err) => {
				reject(err)
			})
		} else {
			const parser = serialPort.pipe(new ByteLength({ length: 5 }))
			parser.on('data', (data) => {
				// console.log('Data: ', data)
				resolve(data)
			})
			parser.on('error', (err) => {
				reject(err)
			})
		}
	})
}

function spacerBuff(serialPort) {
	return new Promise((resolve, reject) => {
		serialPort.once('data', function (data) {
			resolve(data)
		})
		serialPort.once('error', function (err) {
			reject(err)
		})
	})
}

function reset(serialPort) {
	return new Promise((resolve, reject) => {
		sendSync(serialPort, Buffer.from([0x56, 0x00, 0x26, 0x00]), 5)
		.then(ack => {
			// console.log('Ack Reset: ', ack)
			resolve(ack)
		})
		.catch(err => reject(err))
	})
}

function recover(serialPort) {
	return new Promise((resolve, reject) => {
		sendSync(serialPort, Buffer.from([0x56, 0x00, 0x36, 0x01, 0x03]), 5)
		.then(ack => {
			// console.log('Ack Recover: ', ack)
			resolve(ack)
		})
		.catch(err => reject(err))
	})
}

function takingImage(serialPort) {
	return new Promise((resolve, reject) => {
		sendSync(serialPort, Buffer.from([0x56, 0x00, 0x36, 0x01, 0x00]), 5)
		.then(ack => resolve(ack))
		.catch(err => reject(err))
	})
}

function getImageLength(serialPort) {
	return new Promise((resolve, reject) => {
		sendSync(serialPort, Buffer.from([0x56, 0x00, 0x34, 0x01, 0x00]))
		.then(ack => {
			var length = ack.readUIntBE(ack.length - 2, 2)
			arrImgCmd.push(Buffer.from([0x56, 0x00, 0x32, 0x0C, 0x00, 0x0A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))
			arrImgCmd.push(ack.slice(ack.length - 2, ack.length))
			arrImgCmd.push(Buffer.from([0x00, 0x0A]))
			resolve({
				ack: ack,
				buff: Buffer.concat(arrImgCmd),
				length: length
			})
		})
		.catch(err => reject(err))
	})
}

function getImageData(serialPort, buff, length) {
	return new Promise((resolve, reject) => {
		serialPort.write(buff)
		const LengthParser = require('@serialport/parser-byte-length')
		const imgDataParser = serialPort.pipe(new LengthParser({ length: length }))
		imgDataParser.on('data', (data) => {
			// console.log('Data: ', data)
			resolve(data.slice(5, (data.length - 5)))
		})
		imgDataParser.on('error', (err) => {
			reject(err)
		})
	})
} 

async function captureImageData(address, baudrate) {
	return new Promise(async (resolve, reject) => {
		console.log('Capture Image')
		var port = new SerialPort(address, {
			baudRate: baudrate
		})
		// var ackReset = await reset(port)
		// console.log('Reset: ', ackReset)
		// var ackTakingImage = await takingImage(port)
		// console.log('Taking Image: ', ackTakingImage)
		// var ackRecover = await recover(port)
		// console.log('Recovery: ', ackRecover)
		var ackImageLength = await getImageLength(port)
		console.log('Image Length: ', ackImageLength)
		var ackImageData = await getImageData(port, ackImageLength.buff, ackImageLength.length)
		console.log('Image Data: ', ackImageData)
		resolve(ackImageData.toString('base64'))
		/* setTimeout(async function () {
			var ackTakingImage = await takingImage(port)
			console.log('Taking Image: ', ackTakingImage)
			var ackRecover = await recover(port)
			console.log('Recovery: ', ackRecover)
			var ackImageLength = await getImageLength(port)
			console.log('Image Length: ', ackImageLength)
			var ackImageData = await getImageData(port, ackImageLength.buff, ackImageLength.length)
			console.log('Image Data: ', ackImageData)
			resolve(ackImageData.toString('base64'))
		}, 300)
		setTimeout(async function () {
			var ackImageLength = await getImageLength(port)
			console.log('Image Length: ', ackImageLength)
			resolve(ackImageLength)
		}, 500) */
		port.on('error', (err) => {
			reject(err)
		})
	})
}

try {
	var arrImgCmd = []
	var arrImgData = []
	var concatResult = []
	console.log('Start')
	captureImageData('/dev/ttyS0', 38400)
	.then(res => {
		console.log('Result: ', res)
	})
	.catch(err => {
		console.error(err)	
	})
} catch (err) {
	console.error(err)
}

