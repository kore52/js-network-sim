$(document).ready(function(){

  var PC1 = new Layer3Device('192.168.0.1', null, '11-22-33-44-55-01', [new Interface('eth1')], function(srcPort, data){
    if (data.destinationMACAddress.equals('11-22-33-44-55-01'))
      console.log(JSON.stringify(data))
  })
  var PC2 = new Layer3Device('192.168.0.1', null, '11-22-33-44-55-02', [new Interface('eth2')], function(srcPort, data){
    if (data.destinationMACAddress.equals('11-22-33-44-55-02'))
      console.log(JSON.stringify(data))
  })

  var PC3 = new Layer2Device('11-22-33-44-55-03', [new Interface('eth3')], function(srcPort, data){
    if (data.destinationMACAddress.equals('11-22-33-44-55-03'))
      console.log(JSON.stringify(data))
  })

  var PCA = new Layer2Device('aa-bb-cc-dd-ee-fa', [new Interface('etha')], function(srcPort, data){
    if (data.destinationMACAddress.equals('aa-bb-cc-dd-ee-fa'))
      console.log(JSON.stringify(data))
  })

  var PCB = new Layer2Device('aa-bb-cc-dd-ee-fb', [new Interface('ethb')], function(srcPort, data){
    if (data.destinationMACAddress.equals('aa-bb-cc-dd-ee-fb'))
      console.log(JSON.stringify(data))
  })

  var PCC = new Layer2Device('aa-bb-cc-dd-ee-fc', [new Interface('ethc')], function(srcPort, data){
    if (data.destinationMACAddress.equals('aa-bb-cc-dd-ee-fc'))
      console.log(JSON.stringify(data))
  })

  var HUB1 = new Layer2Device(null, [new Interface('port0'),
                              new Interface('port1'),
                              new Interface('port2'),
                              new Interface('port3')])
  var HUB2 = new Layer2Device(null, [new Interface('port0'),
                              new Interface('port1'),
                              new Interface('port2'),
                              new Interface('port3'),])


  PC1.connect('eth1', HUB1.getInterface('port0'))
  PC2.connect('eth2', HUB1.getInterface('port1'))
  PC3.connect('eth3', HUB1.getInterface('port2'))
  HUB1.connect('port3', HUB2.getInterface('port0'))
  PCA.connect('etha', HUB2.getInterface('port1'))
  PCB.connect('ethb', HUB2.getInterface('port2'))
  PCC.connect('ethc', HUB2.getInterface('port3'))

//  PC1.send('eth1', new MAC('11-22-33-44-55-02'), "PC1->PC2")
//  PC2.send('eth2', new MAC('11-22-33-44-55-01'), "PC2->PC1")
  PC3.send('eth3', new MAC('aa-bb-cc-dd-ee-fa'), "PC3->PCA")
  PCC.send('ethc', new MAC('11-22-33-44-55-03'), "PCC->PC3")

  var foo = function(){
    console.log('hello')

    this.bar = function(){
      console.log('world')
      return this
    }
    return this
  }
  foo().bar()
})
