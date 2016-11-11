
describe('MAC Class', function() {

  describe('new MAC()', function() {

    it('creates instance 1', function() {
      expect(function(){ new MAC() }).to.throw(Error)
    })

    it('creates instance 2', function() {
      expect(function(){ new MAC('00:00:00:00:00:00') }).to.not.throw(Error)
    })

    it('creates instance 3', function() {
      expect(function(){ new MAC('ff:ff:ff:ff:ff:ff') }).to.not.throw(Error)
    })

    it('creates instance 4', function() {
      expect(function(){ new MAC('FF:FF:FF:FF:FF:FF') }).to.not.throw(Error)
    })

    it('creates instance 5', function() {
      expect(function(){ new MAC('00-00-00-00-00-00') }).to.not.throw(Error)
    })

    it('creates instance 6', function() {
      expect(function(){ new MAC('ff-ff-ff-ff-ff-ff') }).to.not.throw(Error)
    })

    it('creates instance 7', function() {
      expect(function(){ new MAC('FF-FF-FF-FF-FF-FF') }).to.not.throw(Error)
    })

    it('creates instance 8', function() {
      expect(function(){ new MAC('0000:0000:0000') }).to.not.throw(Error)
    })

    it('creates instance 9', function() {
      expect(function(){ new MAC('ffff:ffff:ffff') }).to.not.throw(Error)
    })

    it('creates instance 10', function() {
      expect(function(){ new MAC('FFFF:FFFF:FFFF') }).to.not.throw(Error)
    })

    it('creates instance 11', function() {
      expect(function(){ new MAC('qwerty') }).to.throw(Error)
    })

    it('creates instance 12', function() {
      expect(function(){ new MAC([]) }).to.throw(Error)
    })
  })

  describe('str()', function() {
    it('should show string format 1', function() {
      var mac = new MAC('00-00-00-00-00-00')
      expect(mac.str()).to.equal('00:00:00:00:00:00')
    })

    it('should show string format 2', function() {
      var mac = new MAC('ff:ff:ff:ff:ff:ff')
      expect(mac.str()).to.equal('ff:ff:ff:ff:ff:ff')
    })

    it('should show string format 3', function() {
      var mac = new MAC('FF:FF:FF:FF:FF:FF')
      expect(mac.str()).to.equal('ff:ff:ff:ff:ff:ff')
    })
  })

  describe('equal()', function() {
    it('should equal to other MAC object', function() {
      var mac1 = new MAC('00-00-00-00-00-00')
      var mac2 = new MAC('00-00-00-00-00-00')
      expect(mac1.equal(mac2)).to.equal(true)
    })

    it('should equal to other MAC object by different input', function() {
      var mac1 = new MAC('00-00-00-00-00-00')
      var mac2 = new MAC(new MAC('00:00:00:00:00:00'))
      expect(mac1.equal(mac2)).to.equal(true)
    })

    it('should NOT equal to other MAC object', function() {
      var mac1 = new MAC('00-00-00-00-00-00')
      var mac2 = new MAC('ff-ff-ff-ff-ff-ff')
      expect(mac1.equal(mac2)).to.not.equal(true)
    })
  })
})


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
})


describe('Connection class', function() {
  describe('connect()', function() {
    it('should be put Interface in', function() {

    })
  })
})
