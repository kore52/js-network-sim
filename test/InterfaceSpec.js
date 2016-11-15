
describe('Interface class', function() {
  describe('constructor', function() {
    it('should check whether name is string or not', function() {
      expect(new Interface('eth0').name).to.be.a('string')
      expect(new Interface(1).name).to.not.be.a('string')
    })

    it('should check whether vlan-id have 1 by default or not', function() {
      expect(new Interface('eth0').vlan).to.equal(1)
    })

    it('should check whether vlan-id have a value between 0 and 4095 or not', function() {
      expect(new Interface('eth0', 0).vlan).to.be.least(0)
      expect(new Interface('eth0', 4095).vlan).to.be.below(4096)
    })

    it('should not connected by default', function() {
      expect(new Interface('eth0').isConnect).to.equal(false)
    })

    it('should not be a trunk port by default', function() {
      expect(new Interface('eth0').isTrunk).to.equal(false)
    })

    it('should be all allowed vlan by default', function() {
      expect(new Interface('eth0').trunkAllowedVlan).to.be.an.instanceof(Range)
    })
  })


  describe('connect()', function() {

    it('should connect to other Interface', function() {
      expect(new Interface('eth0').connect(new Interface('eth2'))).to.equal(true)
    })

    it('should throw an error if you try to connect to Interface that is already connected', function() {
      var if1 = new Interface('eth1')
      var if2 = new Interface('eth2')
      var if3 = new Interface('eth3')
      if1.connect(if2)
      expect(function() { if1.connect(if3) }).to.throw(Error)
    })

    it('should throw an error if you try to connect to Interface that is already connected to another Interface', function() {
      var if1 = new Interface('eth1')
      var if2 = new Interface('eth2')
      if1.connect(if2)
      var if3 = new Interface('eth3')
      expect(function() { if3.connect(if1)}).to.throw(Error)
    })
  })


  describe('disconnect()', function() {

    it('should throw an error if you try to disconnect from Interface that is no longer connected', function() {
      var if1 = new Interface('eth1')
      expect(function() { if1.disconnect() }).to.throw(Error)
    })
  })


  describe('getConnection()', function() {

    it('should get a Connection object after it has connected to other interface', function() {
      var if1 = new Interface('eth1')
      var if2 = new Interface('eth2')
      if1.connect(if2)
      expect(if1.getConnection()).to.be.an.instanceof(Connection)
    })

    it('should return an undefined when it still does not connect to other interface', function() {
      var if1 = new Interface('eth1')
      expect(if1.getConnection()).to.equal(undefined)
    })

    it('should return an undefined after it has disconnected from other interface', function() {
      var if1 = new Interface('eth1')
      var if2 = new Interface('eth2')
      if1.connect(if2)
      if1.disconnect()
      expect(if1.getConnection()).to.equal(undefined)
    })
  })


  describe('transfer()', function() {

    it('should return an undefined when it still does not connect to other interface', function() {
      var if1 = new Interface('eth1')
      expect(if1.transfer({})).to.equal(undefined)
    })
  })
})
