const { exec } = require('child_process')

exec(`curl -F file=@tester/sip.png https://store2.gofile.io/uploadFile`, (err, stdout) => {
	console.log(stdout)
})