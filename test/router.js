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

  var PC1 = new Layer3Device([new Interface('eth0')], function(srcPort, data){
    if (new MAC(data.destinationMACAddress).equals('11-22-33-44-55-01'))
      console.log(JSON.stringify(data))
  })
  .setMAC([['eth0', '11-22-33-44-55-01']])
  .setIP([['eth0', '192.168.0.1', '255.255.255.0']])
  .setRoute([new Route('static', '0.0.0.0', '0.0.0.0', '192.168.0.254', 'eth0')])

  var PC2 = new Layer3Device([new Interface('eth0')], function(srcPort, data){
    if (new MAC(data.destinationMACAddress).equals('11-22-33-44-55-02'))
      console.log(JSON.stringify(data))
  })
  .setMAC([['eth0', '11-22-33-44-55-02']])
  .setIP([['eth0', '192.168.0.2', '255.255.255.0']])
  .setRoute([new Route('static', '0.0.0.0', '0.0.0.0', '192.168.0.254', 'eth0')])

  var PCA = new Layer3Device([new Interface('eth0')], function(srcPort, data){
    if (new MAC(data.destinationMACAddress).equals('aa-bb-cc-dd-ee-fa'))
      console.log(JSON.stringify(data))
  })
  .setMAC([['eth0', 'aa-bb-cc-dd-ee-fa']])
  .setIP([['eth0', '192.168.0.3', '255.255.255.0']])
  .setRoute([new Route('static', '0.0.0.0', '0.0.0.0', '192.168.0.254', 'eth0')])

  var PCB = new Layer3Device([new Interface('eth0')], function(srcPort, data){
    if (new MAC(data.destinationMACAddress).equals('aa-bb-cc-dd-ee-fb'))
      console.log(JSON.stringify(data))
  })
  .setMAC([['eth0', 'aa-bb-cc-dd-ee-fb']])
  .setIP([['eth0', '192.168.0.4', '255.255.255.0']])
  .setRoute([new Route('static', '0.0.0.0', '0.0.0.0', '192.168.0.254', 'eth0')])

  var L2SW1 = new Layer2Device([new Interface('port0'),
    new Interface('port1', 10),
    new Interface('port2', null, true, [10, 20]),
    new Interface('port3', 10)]);

  var L2SW2 = new Layer2Device([new Interface('port0'),
    new Interface('port1', 10),
    new Interface('port2', null, true, [10, 20]),
    new Interface('port3', 10)])

  var L3SW1 = new Layer3Device([new Interface('L3port0'), new Interface('L3port1')])
  .setMAC([
    ['L3port0', '00-00-00-11-11-11'],
    ['L3port1', '00-00-00-22-22-22']
  ])
  .setIP([
    ['L3port0', '192.168.0.254', '255.255.255.0'],
    ['L3port1', '192.168.10.254', '255.255.255.0']
  ])

  PC2.connect('eth0', L2SW1.getInterface('port1'))
  PC1.connect('eth0', L2SW1.getInterface('port3'))
  L2SW1.connect('port2', L2SW2.getInterface('port2'))
  PCB.connect('eth0', L2SW2.getInterface('port1'))
  PCA.connect('eth0', L2SW2.getInterface('port3'))

  PC1.send('eth0', new IPv4('192.168.0.4'), "PC1->PCB")
  console.log(JSON.stringify(L3SW1.route))


})
