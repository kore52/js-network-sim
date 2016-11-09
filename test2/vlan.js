$(document).ready(function(){

  var PC2 = new Layer2Device([new Interface('eth0')], function(srcPort, data){
    if (data.destinationMACAddress.equals('11-22-33-44-55-02'))
      console.log(JSON.stringify(data))
  }).setMAC(['eth0', '11-22-33-44-55-02'])

  var PC3 = new Layer2Device([new Interface('eth0')], function(srcPort, data){
    if (data.destinationMACAddress.equals('11-22-33-44-55-03'))
      console.log(JSON.stringify(data))
  }).setMAC(['eth0', '11-22-33-44-55-03'])

  var PCA = new Layer2Device([new Interface('eth0')], function(srcPort, data){
    if (data.destinationMACAddress.equals('aa-bb-cc-dd-ee-fa'))
      console.log(JSON.stringify(data))
  }).setMAC(['eth0', 'aa-bb-cc-dd-ee-fa'])

  var PCB = new Layer2Device([new Interface('eth0')], function(srcPort, data){
    if (data.destinationMACAddress.equals('aa-bb-cc-dd-ee-fb'))
      console.log(JSON.stringify(data))
  }).setMAC(['eth0', 'aa-bb-cc-dd-ee-fb'])

  var L2SW1 = new Layer2Device([new Interface('port0'),
    new Interface('port1', 20),
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

  PC3.send('eth0', new MAC('aa-bb-cc-dd-ee-fa'), "PC3->PCA")
  PC2.send('eth0', new MAC('aa-bb-cc-dd-ee-fb'), "PC2->PCB")

  PC2.send('eth0', new MAC('aa-bb-cc-dd-ee-fa'), "PC2->PCA") // ×
  PC3.send('eth0', new MAC('aa-bb-cc-dd-ee-fb'), "PC3->PCB") // ×


})
