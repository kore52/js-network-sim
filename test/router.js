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

  var PC2 = new Layer3Device([new Interface('eth0')], function(srcPort, data){
    if (new MAC(data.destinationMACAddress).equals('11-22-33-44-55-02'))
      console.log(JSON.stringify(data))
  })
  .setMAC([['eth0', '11-22-33-44-55-02']])
  .setIP([['eth0', '192.168.0.1', '255.255.255.0']])
  .setRoute([['0.0.0.0', '0.0.0.0', '192.168.0.254']])

  var PC3 = new Layer3Device([new Interface('eth0')], function(srcPort, data){
    if (new MAC(data.destinationMACAddress).equals('11-22-33-44-55-03'))
      console.log(JSON.stringify(data))
  })
  .setMAC([['eth0', '11-22-33-44-55-03']])
  .setIP([['eth0', '192.168.0.2']])
  .setRoute([['0.0.0.0', '0.0.0.0', '192.168.0.254']])

  var PCA = new Layer2Device([new Interface('eth0')], function(srcPort, data){
    if (new MAC(data.destinationMACAddress).equals('aa-bb-cc-dd-ee-fa'))
      console.log(JSON.stringify(data))
  })
  .setMAC([['eth0', 'aa-bb-cc-dd-ee-fa']])

  var PCB = new Layer2Device([new Interface('eth0')], function(srcPort, data){
    if (new MAC(data.destinationMACAddress).equals('aa-bb-cc-dd-ee-fb'))
      console.log(JSON.stringify(data))
  })
  PCB.setMAC([['eth0', 'aa-bb-cc-dd-ee-fb']])

  var L2SW1 = new Layer2Device([new Interface('port0'),
    new Interface('port1', 10),
    new Interface('port2', null, true, [10, 20]),
    new Interface('port3', 10)]);

  var L2SW2 = new Layer2Device([new Interface('port0'),
    new Interface('port1', 10),
    new Interface('port2', null, true, [10, 20]),
    new Interface('port3', 20)])

  PC3.connect('eth0', L2SW1.getInterface('port1'))
  PC2.connect('eth0', L2SW1.getInterface('port3'))
  L2SW1.connect('port2', L2SW2.getInterface('port2'))
  PCB.connect('eth0', L2SW2.getInterface('port1'))
  PCA.connect('eth0', L2SW2.getInterface('port3'))

  PC2.send('eth0', new IPv4('192.168.0.2'), "PC2->PC3")


})
