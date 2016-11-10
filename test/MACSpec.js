
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
    it('names should have string type', function() {
      expect(new Interface('test').name).to.be.a('string')
      expect(new Interface(1).name).to.not.be.a('string')
    })

    it('vlan id should be 1 by default', function() {
      expect(new Interface('test').vlan).to.equal(1)
    })

    it('vlan id should have a value between 0 and 4095', function() {
      expect(new Interface('test', 0).vlan).to.be.least(0)
      expect(new Interface('test', 4095).vlan).to.be.below(4096)
    })

    it('should not connected by default', function() {
      expect(new Interface('test').isConnect).to.equal(false)
    })

    it('should not be a trunk port by default', function() {
      expect(new Interface('test').isTrunk).to.equal(false)
    })

    it('should be all allowed vlan by default', function() {
      expect(new Interface('test').trunkAllowedVlan).to.be.an.instanceof(Range)
    })
  })
})


describe('Connection class', function() {
  describe('connect()', function() {
    it('should be put Interface in', function() {

    })
  })
})
