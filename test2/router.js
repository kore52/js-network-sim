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
  .setRoute([new Route('static', '0.0.0.0', '0.0.0.0', '192.168.0.254')])

  var PC2 = new Layer3Device([new Interface('eth0')], function(srcPort, data){
    if (new MAC(data.destinationMACAddress).equals('11-11-11-11-11-02'))
      console.log(JSON.stringify(data))
  })
  .setMAC([['eth0', '11-11-11-11-11-02']])
  .setIP([['eth0', '192.168.0.2', '255.255.255.0']])
  .setRoute([new Route('static', '0.0.0.0', '0.0.0.0', '192.168.0.254')])

  var L3SW1 = new Layer3Device([new Interface('L3port0'), new Interface('L3port1')])

  PC1.connect('eth0', L3SW1.getInterface('L3port0'))
  PC2.connect('eth0', L3SW1.getInterface('L3port1'))


  PC1.send('eth0', new IPv4('192.168.0.2'), "PC1->PC2")
  PC1.sendICMPEcho('eth0', new IPv4('192.168.0.2'), 1)
  PC1.sendICMPEcho('eth0', new IPv4('192.168.0.2'), 2)
  PC1.sendICMPEcho('eth0', new IPv4('192.168.0.2'), 3)
  PC1.sendICMPEcho('eth0', new IPv4('192.168.0.2'), 4)


})
