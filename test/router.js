$(document).ready(function(){

  console.log('begin test.' + (function() {
    if (document.currentScript) {
      return document.currentScript.src
    } else {
      var scripts = document.getElementsByTagName('script')
      script = scripts[scripts.length-1]
      if (script.src) {
        return script.src
      }
    }
  })())

  /*
    TEST case


  */
  var PC1 = new Layer3Device([new Interface('eth0')], function(srcPort, data){
    if (new MAC(data.destinationMACAddress).equals('11-11-11-11-11-01'))
      console.log(JSON.stringify(data))
  })
  .setMAC([['eth0', '11-11-11-11-11-01']])
  .setIP([['eth0', '192.168.0.1', '255.255.255.0']])
  .setRoute([new Route('static', '0.0.0.0', '0.0.0.0', '192.168.0.254', 'eth0')])

  var PC2 = new Layer3Device([new Interface('eth0')], function(srcPort, data){
    if (new MAC(data.destinationMACAddress).equals('11-11-11-11-11-02'))
      console.log(JSON.stringify(data))
  })
  .setMAC([['eth0', '11-11-11-11-11-02']])
  .setIP([['eth0', '192.168.0.2', '255.255.255.0']])
  .setRoute([new Route('static', '0.0.0.0', '0.0.0.0', '192.168.0.254', 'eth0')])

  var PC3 = new Layer3Device([new Interface('eth0')], function(srcPort, data){
    if (new MAC(data.destinationMACAddress).equals('11-11-11-11-11-03'))
      console.log(JSON.stringify(data))
  })
  .setMAC([['eth0', '11-11-11-11-11-03']])
  .setIP([['eth0', '192.168.0.3', '255.255.255.0']])
  .setRoute([new Route('static', '0.0.0.0', '0.0.0.0', '192.168.0.254', 'eth0')])

  var PC4 = new Layer3Device([new Interface('eth0')], function(srcPort, data){
    if (new MAC(data.destinationMACAddress).equals('11-11-11-11-11-04'))
      console.log(JSON.stringify(data))
  })
  .setMAC([['eth0', '11-11-11-11-11-04']])
  .setIP([['eth0', '192.168.0.4', '255.255.255.0']])
  .setRoute([new Route('static', '0.0.0.0', '0.0.0.0', '192.168.0.254', 'eth0')])
/*
  var L2SW1 = new Layer2Device([new Interface('port0'),
    new Interface('port1', 10),
    new Interface('port2', null, true, [10, 20]),
    new Interface('port3', 10)]);

  var L2SW2 = new Layer2Device([new Interface('port0'),
    new Interface('port1', 10),
    new Interface('port2', null, true, [10, 20]),
    new Interface('port3', 10)])
*/
  var L3SW1 = new Layer3Device([new Interface('L3port0'), new Interface('L3port1')])
/*  .setMAC([
    ['L3port0', '00-00-00-11-11-11'],
    ['L3port1', '00-00-00-22-22-22']
  ])
  .setIP([
    ['L3port0', '192.168.0.254', '255.255.255.0'],
    ['L3port1', '192.168.10.254', '255.255.255.0']
  ])
*/
  PC1.connect('eth0', L3SW1.getInterface('L3port0'))
  PC2.connect('eth0', L3SW1.getInterface('L3port1'))
//  L3SW1.connect('port2', L2SW2.getInterface('port2'))
//  PC3.connect('eth0', L2SW2.getInterface('port3'))
//  PC4.connect('eth0', L2SW2.getInterface('port1'))

  PC1.send('eth0', new IPv4('192.168.0.2'), "PC1->PC2")


})
