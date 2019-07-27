const EtherPortClient = require("etherport-client").EtherPortClient;
const five = require('johnny-five');
const fs = require('fs');

let gestureType;
let stream, sampleNumber;

const board = new five.Board({
    port: new EtherPortClient({
      host: "192.168.1.113", //Your Arduino IP goes here
      port: 3030
    }),
    timeout: 1e5,
    repl: false
});

board.on("ready", function() {
    console.log("Board ready!");
    const button = new five.Button("A0");

    process.argv.forEach(function(val, index, array){
        gestureType = array[2];
        sampleNumber = parseInt(array[3]);
    });

    stream = fs.createWriteStream(`./data/arduino/sample_${gestureType}_${sampleNumber}.txt`, {flags: 'a'});

    const imu = new five.IMU({
        pins: [11,12], // connect SDA to 11 and SCL to 12
        controller: "MPU6050"
    });

    imu.on("data", function() {
        let data = `START ${this.accelerometer.x} ${this.accelerometer.y} ${this.accelerometer.z} ${this.gyro.x} ${this.gyro.y} ${this.gyro.z} END`;
        console.log(data)
        button.on("hold", function() {
            stream.write(`${data} \r\n`);
        });
    });

    button.on("release", function() {
        stream.end();
    });
});

board.on("close", function() {
    console.log("Board disconnected");
});