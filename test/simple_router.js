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
  .setIP([['eth0', '192.168.10.1', '255.255.255.0']])
  .setRoute([new Route('static', '0.0.0.0', '0.0.0.0', '192.168.10.254', 'eth0')])


  var L3SW1 = new Layer3Device([new Interface('L31port0'), new Interface('L31port1')])
  .setMAC([
    ['L31port0', '00-00-00-11-11-11'],
    ['L31port1', '00-00-00-22-22-22']
  ])
  .setIP([
    ['L31port0', '192.168.0.254', '255.255.255.0'],
    ['L31port1', '192.168.20.254', '255.255.255.0']
  ])
  .setRoute([new Route('static', '192.168.10.0', '255.255.255.0', '192.168.20.253', 'L31port0')])

  var L3SW2 = new Layer3Device([new Interface('L32port0'), new Interface('L32port1')])
  .setMAC([
    ['L32port0', '00-00-00-33-33-33'],
    ['L32port1', '00-00-00-44-44-44']
  ])
  .setIP([
    ['L32port0', '192.168.20.253', '255.255.255.0'],
    ['L32port1', '192.168.10.254', '255.255.255.0']
  ])
  .setRoute([new Route('static', '192.168.0.0', '255.255.255.0', '192.168.20.254', 'L32port0')])

  PC1.connect('eth0', L3SW1.getInterface('L31port0'))
  PC2.connect('eth0', L3SW2.getInterface('L32port1'))
  L3SW1.connect('L31port1', L3SW2.getInterface('L32port0'))

  PC1.send('eth0', new IPv4('192.168.10.1'), "PC1->PC2")
  $('#result').html(JSON.stringify(L3SW1.route, null, 2))


})
