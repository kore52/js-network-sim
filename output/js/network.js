/**
 * MACアドレスを表現する
 * @param {string|MAC} macAddr
 */
function MAC(macAddr) {

  if (macAddr instanceof MAC) {
    this.mac = macAddr.mac
    return
  }

  if (typeof macAddr !== 'string') { throw new Error('bad type')}

  // 00:00:00:00:00:00 のパターンマッチ
  // ff-ff-ff-ff-ff-ff のパターンマッチ
  var macAddrMatch1 = macAddr.match(/^([0-9a-fA-F]{2})[-:]([0-9a-fA-F]{2})[-:]([0-9a-fA-F]{2})[-:]([0-9a-fA-F]{2})[-:]([0-9a-fA-F]{2})[-:]([0-9a-fA-F]{2})$/)
  if (typeof macAddr === 'string' && macAddrMatch1) {
    this.mac = macAddrMatch1.map(function(v){return parseInt(v, 16)})
    this.mac = this.mac.slice(1)
    return macAddr
  }

  // FFFF:FFFF:FFFF のパターンマッチ
  // FFFF.FFFF.FFFF のパターンマッチ
  var macAddrMatch2 = macAddr.match(/^([0-9a-fA-F]{2})([0-9a-fA-F]{2})[:.]([0-9a-fA-F]{2})([0-9a-fA-F]{2})[:.]([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/)
  if (typeof macAddr === 'string' && macAddrMatch2) {
    this.mac = macAddrMatch2.map(function(v){return parseInt(v, 16)})
    this.mac = this.mac.slice(1)
    return macAddr
  }

  throw new Error('bad input:'+macAddr+typeof macAddr)
}
(function(){

  /**
   * MACアドレスを文字列形式で返す
   *  (書式: 00:00:00:00:00:00)
   */
  MAC.prototype.str = function() {
    return ('0'+this.mac[0].toString(16)).slice(-2)+
      ':'+('0'+this.mac[1].toString(16)).slice(-2)+
      ':'+('0'+this.mac[2].toString(16)).slice(-2)+
      ':'+('0'+this.mac[3].toString(16)).slice(-2)+
      ':'+('0'+this.mac[4].toString(16)).slice(-2)+
      ':'+('0'+this.mac[5].toString(16)).slice(-2)
  }

  /**
   * 比較
   */
  MAC.prototype.equal = function(to) {
    var cmp = new MAC(to)
    for (var i=0; i<cmp.mac.length; i++) {
      if (this.mac[i] !== cmp.mac[i]) { return false }
    }
    return true
  }

}())


/**
 * インターフェイス間の物理的・論理的接続を表現するクラス
 */
function Connection() {
  this.connected = []
}
(function(){
  Connection.prototype.connect = function(iface) {
    if (!(iface instanceof Interface)) throw new Error('bad type')
    if (this.connected.length > 2) throw new Error("too many connection")
    this.connected.push(iface)
    return true
  }

  Connection.prototype.disconnect = function(iface) {
    if (!(iface instanceof Interface)) throw new Error('bad type')
    if (this.connected.indexOf(iface) < 0) throw new Error('interface is not yet connected')
    this.connected = []
    return true
  }


  /**
   * データをConnectionの対向側に転送する
   * @param {object} src  送信元インターフェイス
   * @param {object} data 送信データ
   */
  Connection.prototype.transfer = function(src, data) {
    var dest = this.opposite(src)
    if (dest == null) throw new Error('connection not established : ' + e)

    return dest.device.receive(dest, data)
  }

  Connection.prototype.opposite = function(one) {
    return (one === this.connected[0]) ? this.connected[1] : this.connected[0]
  }
}())


/**
 * ネットワークインターフェイス
 * @param {string}      name             インターフェイス名
 * @param {number}      vlan             VLAN_ID(0-4095)、default:1
 * @param {boolean}     isTrunk          true:トランクポート, false:アクセスポート(default)
 * @param {array|Range} trunkAllowedVlan トランクポート時許可するvlanの配列もしくは範囲
 */
function Interface(name, vlan, isTrunk, trunkAllowedVlan) {

  this.name = name
  this.vlan = (vlan !== undefined) ? vlan : 1
  this.isConnect = false
  this.isTrunk = (isTrunk !== undefined) ? isTrunk : false
  this.trunkAllowedVlan = (trunkAllowedVlan !== undefined) ? trunkAllowedVlan : new Range(0, 4095)

  return this
}
(function(){

  /**
   * インターフェイス接続
   * @param {Interface} dest 接続先インターフェイス
   */
  Interface.prototype.connect = function(dest) {
    if (this.isConnect) { throw new Error('this Interface is already connected') }
    if (dest.isConnect) { throw new Error('destination Interface is already connected.')}
    if (!this.connection) { this.connection = new Connection() }

    // 双方向で接続
    this.connection.connect(dest)
    dest.connection = this.connection
    dest.connection.connect(this)
    this.isConnect = true
    dest.isConnect = true

    return true
  }

  /**
   * インターフェイス切断
   * @param {Interface} from 接続先
   */
  Interface.prototype.disconnect = function() {
    if (!this.connection) { throw new Error('Interface has no longer connected.') }

    this.connection.disconnect(this)
    this.connection = undefined
    this.isConnect = false

    return true
  }

  /**
   * 他インターフェイスとの接続を取得
   */
  Interface.prototype.getConnection = function() {
    return this.connection
  }

  /**
   * 対向のインターフェイスにデータを送信する。
   * 処理は Connection.transfer() に委譲
   * @param {object} data 転送データ
   */
  Interface.prototype.transfer = function(data) {
    // 接続されていない場合は破棄
    if (!this.isConnect) { return }

    return this.connection.transfer(this, data)
  }

  /**
   * true : トランクポート
   * false : アクセスポート
   */
  Interface.prototype.setTrunk = function(enable) {
    this.isTrunk = enable
  }
}())


/**
 * L2デバイスを表現
 * @param {Array(Interface)} interfaces          保持するインターフェイスの配列
 * @param {function}         receiveCallback 受信したデータを処理するコールバック関数
 */
function Layer2Device(interfaces, receiveCallback) {
  if (!(interfaces instanceof Array)) throw new Error('bad type: interfaces type is not an array')
  if (receiveCallback !== undefined && typeof receiveCallback !== 'function') throw new Error('bad type')

  this.interfaces = interfaces
  for (var i=0; i < this.interfaces.length; i++) {
    if (!(this.interfaces[i] instanceof Interface)) throw new Error('bad type')
    this.interfaces[i].device = this
  }
  this.macAddrTable = []

  // 受信したデータの処理方法
  if (receiveCallback) {
    this.receiveCallback = receiveCallback
  }

  return this
}
(function(){

  /**
   * データ受信コールバック関数が定義されていない場合のデフォルト動作
   * 他のインターフェイスにフレームを転送する動作をする(L2スイッチ)
   * @param {Interface} srcDevice 送信元デバイスのインターフェイス
   * @param {object} recv         受信データ
   */
  Layer2Device.prototype.receive = function(srcDevice, recv) {

    if (this.receiveCallback) {
      return this.receiveCallback(srcDevice, recv)
    }

    var srcSwitchPort = srcDevice.getConnection().opposite(srcDevice)
    return this.transfer(srcSwitchPort, new MAC(recv.sourceMACAddress), new MAC(recv.destinationMACAddress), recv)
  }


  /**
   * 受信したL2フレームを宛先MACアドレスからデバイス内の別ポートに転送する
   * @param {Interface} srcPort 送信元インターフェイス
   * @param {MAC} srcMAC        送信元MACアドレス
   * @param {MAC} destMAC       宛先MACアドレス
   * @param {object} frame      送信データ
   */
  Layer2Device.prototype.transfer = function(srcPort, srcMAC, destMAC, frame) {

    this._addMacTable(srcPort.name, srcMAC)

    // ブロードキャストを処理
    if (destMAC.equal('ff-ff-ff-ff-ff-ff')) {
      return this._sendBroadcast(srcPort, this.interfaces, frame)
    }

    // ユニキャスト
    var destPort = this._searchPort(destMAC)
    if (destPort.length) {
      frame = this._processVlan(srcPort, destPort[0], frame)
      if (frame) {
        return destPort[0].transfer(frame)
      }
    }

    // MACテーブルに登録されていないのでブロードキャストする
    return this._sendBroadcast(srcPort, this.interfaces, frame)
  }


  /**
   * MACアドレスの設定
   * (e.g.)
   * var L2 = new Layer2Device(...).setMAC([['eth0', '00-00-00-00-00-00']])
   * @param {array} ifname_and_mac インターフェイス名とMACアドレスが要素の配列
   */
  Layer2Device.prototype.setMAC = function(ifname_and_mac) {
    if (!(ifname_and_mac instanceof Array)) { return this }
    for (var i=0; i < ifname_and_mac.length; i++) {
      this.getInterface(ifname_and_mac[i][0]).mac = new MAC(ifname_and_mac[i][1])
    }
    return this
  }

  /**
   * インターフェイスに接続する
   * @param {string} ifname インターフェイス名
   * @param {string} to     接続先インターフェイスオブジェクト
   */
  Layer2Device.prototype.connect = function(ifname, to) {
    if (typeof ifname !== 'string') { throw new Error('bad connection: ifname is not string') }
    if (!(to instanceof Interface)) { throw new Error('bad connection: to is not interface') }
    this.getInterface(ifname).connect(to)
  }

  /**
   * インターフェイスから切断する
   * @param {string} ifname
   * @param {string} from
   */
  Layer2Device.prototype.disconnect = function(ifname, from) {
    if (typeof ifname !== 'string') { throw new Error('bad connection: ifname is not string') }
    if (!(from instanceof Interface)) { throw new Error('bad connection: from is not interface') }
    this.getInterface(ifname).disconnect(from)
  }

  /**
   * インターフェイス名に合致するのインターフェイスを取得
   * @param {string} ifname インターフェイス名
   */
  Layer2Device.prototype.getInterface = function(ifname) {
    for(var i = 0; i < this.interfaces.length; i++) {
      if (ifname === this.interfaces[i].name)
        return this.interfaces[i]
    }
  }

  /**
   * L2フレームをポートから送信する
   * @param {string} srcPortName 送信元ポート名
   * @param {MAC}    destMAC     宛先MACアドレス
   * @param {object} data        送信データ
   * @param {MAC}    srcMAC      送信元MACアドレス. (default:自動選択)
   */
  Layer2Device.prototype.send = function(srcPortName, destMAC, data, srcMAC) {

    if (typeof srcPortName !== 'string') { throw new Error('bad type') }
    if (!(srcMAC instanceof MAC || srcMAC === undefined)) { throw new Error('bad type') }
    if (!(destMAC instanceof MAC)) { throw new Error('bad type') }

    if (srcMAC === undefined) {
      srcMAC = this.getInterface(srcPortName).mac
    }

    var frame = {
        'sourceMACAddress' : srcMAC.str(),
        'destinationMACAddress' : destMAC.str(),
        'data' : data
    }

    for (var i=0; i < this.interfaces.length; i++) {
      if (srcPortName === this.interfaces[i].name) {
        if (this.interfaces[i].getConnection() === undefined) { throw new Error('connection not established') }
        return this.interfaces[i].getConnection().transfer(this.interfaces[i], frame)
      }
    }

    return undefined
  }

  /**
   * private
   * MACアドレステーブルへ追加する.
   * MAC重複が検出された場合は上書きする.
   * @param {string} ifname インターフェイス名
   * @param {MAC}    mac    MACアドレス
   */
  Layer2Device.prototype._addMacTable = function(ifname, mac) {
    var macObj = new MAC(mac)
    for (var i=0; i < this.macAddrTable.length; i++) {
      if (macObj.equal(this.macAddrTable[i][1])) {
        this.macAddrTable[i] = [ifname, macObj]
        return
      }
    }
    this.macAddrTable.push([ifname, macObj])
  }

  /**
   * private
   * IEEE802.1Dから300秒でレコードがテーブルから削除される
   * @param {string} ifname インターフェイス名
   * @param {MAC}    mac    MACアドレス
   */
  Layer2Device.prototype._delMacTable = function(ifname, mac) {
    var mac_obj = new MAC(mac)
    for (var i=0; i < this.macAddrTable.length; i++) {
      if (ifname === this.macAddrTable[i][0] && mac_obj.equal(this.macAddrTable[i][1]))
        this.macAddrTable.splice(i, 1)
    }
  }

  /**
   * private
   * MACアドレスの学習
   * @param {string} ifname インターフェイス名
   * @param {MAC}    mac    MACアドレス
   */
  Layer2Device.prototype._cacheMacAddr = function(ifname, mac) {
    this.macAddrTable.push([ifname, mac])
    this.macAddrTable.sort(function(a, b){ return a[0] < b[0] })
  }

  /**
   * private
   * フレームのブロードキャスト
   */
  Layer2Device.prototype._sendBroadcast = function(srcPort, interfaces, frame) {
    for (var i=0; i < interfaces.length; i++) {
      if (srcPort.name === interfaces[i].name) continue

      var processedFrame = this._processVlan(srcPort, interfaces[i], frame)
      if (processedFrame)
        return interfaces[i].transfer(processedFrame)
    }
  }

  /**
   * ルールに従ってVLANを処理
   *
   * src\dst| access                  | trunk
   * -------+-------------------------+----------------------
   * access | (a) equal -> ok         | (b) element -> ok
   *        |                         |   add VID to frame
   * -------+-------------------------+---------------
   * trunk  | (c) element -> ok:      | (d) element -> ok
   *        |   delete VID from frame |
   *
   * @param {Interface} srcPort 転送元ポート
   * @param {Interface} destPort 宛先ポート
   * @param {object}    frame    転送フレーム
   * @return 破棄ならばnull
  */
  Layer2Device.prototype._processVlan = function(srcPort, destPort, frame) {

    var vlanArray;
    if (srcPort.isTrunk) {

      if (destPort.isTrunk) {

        if (destPort.trunkAllowedVlan instanceof Range)
          vlanArray = destPort.trunkAllowedVlan.array()
        else {
          vlanArray = destPort.trunkAllowedVlan
        }

        if (vlanArray.indexOf(frame.vid) < 0)
          return // (d)
      } else {
        // if destPort is access port
        if (frame.vid !== destPort.vlan)
          return
        delete frame.vid // (c)
      }

    } else {
      // if srcPort is access port
      if (destPort.isTrunk) {

        if (destPort.trunkAllowedVlan instanceof Range)
          vlanArray = destPort.trunkAllowedVlan.array()
        else
          vlanArray = destPort.trunkAllowedVlan

        if (vlanArray.indexOf(srcPort.vlan) < 0)
          return
        frame.vid = srcPort.vlan // (b)

      } else {
        // if destPort is access port
        if (srcPort.vlan !== destPort.vlan)
          return // (a)
      }
    }
    return frame
  }

  /**
   * private
   * MACアドレステーブルから特定のMACアドレスが記録されたポート番号を返す
   * @param {MAC} mac 比較対象MACアドレス
   * @returns 特定のMACアドレスが記録されたインターフェイスリスト. 見つからない場合は空配列
   */
  Layer2Device.prototype._searchPort = function(mac) {
    var ifList = []
    var macObj = new MAC(mac)
    for (var i=0; i < this.macAddrTable.length; i++) {
      if(macObj.equal(this.macAddrTable[i][1])) {
        ifList.push(this.getInterface(this.macAddrTable[i][0]))
      }
    }
    return ifList
  }
}())

/**
 * IPv4アドレスを表現するクラス
 */
function IPv4(ip) {
  this.set(ip)
}
(function(){

  /**
   * static
   * IPv4フォーマットであることの判定
   * @param {string} str 検査文字列
   */
  IPv4.isValid = function(str) {
    var regexIP = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
    return (str.match(regexIP)) ? true : false
  }

  /**
   * オブジェクトにアドレスをセット
   * @param {number|string|object} IPアドレス
   */
  IPv4.prototype.set = function(ip) {
    try {
      if (ip == null) {
        this.octet = [null, null, null, null]
        return
      }

      if (typeof ip === 'number') {
        ip = ip >>> 0
        this.octet = [(ip & (0xff << 24)) >>> 24, (ip & (0xff << 16)) >>> 16, (ip & (0xff << 8)) >>> 8, ip & 0xff]
        return
      }
      else if (ip instanceof IPv4) {
        this.octet = ip.octet
        return
      }

      var regexIP = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
      if (!ip.match(regexIP)) {
        throw new Error("bad address.: " + ip)
      }

      this.octet = regexIP.exec(ip).slice(1).map(function(o) { return parseInt(o) })
      for (var n in this.octet)
        if (this.octet[n] < 0 || 255 < this.octet[n]) throw new Error("Invalid ip range.: " + ip)
      return
    }
    catch(e) {
      console.log(e)
    }
  }

  /**
   * 12.34.56.78 形式で取得
   */
  IPv4.prototype.str = function() {
    return this.octet[0] + '.' + this.octet[1] + '.' + this.octet[2] + '.' + this.octet[3]
  }

  /**
   * unsinged int で取得
   */
  IPv4.prototype.uint = function () {
    return ((this.octet[0] << 24) + (this.octet[1] << 16) + (this.octet[2] << 8) + this.octet[3]) >>> 0
  }

  /**
   * ネットマスクを与えるとネットワークアドレスを計算
   * @param {IPv4} サブネットマスク
   */
  IPv4.prototype.networkAddr = function(mask) {
    if (!(mask instanceof IPv4)) throw new Error('bad type')
    var ip = this.uint()
    var maskbit = mask.uint()
    return new IPv4(ip & maskbit)
  }

  /**
   * ネットマスクを与えるとブロードキャストアドレスを計算
   * @param {IPv4} サブネットマスク
   */
  IPv4.prototype.broadcastAddr = function(mask) {
    if (!(mask instanceof IPv4)) throw new Error('bad type')
    var ip = this.uint()
    var maskbit = mask.uint()
    return new IPv4((ip & maskbit) + (~maskbit))
  }

  /**
   * 比較
   */
  IPv4.prototype.equal = function(to) {
    return (this.uint() === new IPv4(to).uint())
  }
}())


/**
 * ルーティングテーブルのレコードを表現するクラス
 * @param {string}    type     経路タイプ{direct, static, rip}
 * @param {IPv4}      net      アドレス
 * @param {IPv4}      mask     サブネット
 * @param {object}    nextHop  ネクストホップ/ゲートウェイ
 * @param {string}    portName インターフェイス名
 * @param {number}    distance Administrative Distance/Route Preference
 */
function Route(type, net, mask, nextHop, portName, distance) {
  this.type = type
  this.net = new IPv4(net)
  this.mask = new IPv4(mask)
  this.nextHop = nextHop
  this.portName = portName
  this.distance = (distance !== undefined) ? distance : 0
}
Route.prototype.constructor = Route


/**
 * レイヤー3デバイスを表現するクラス
 */
function Layer3Device(interfaces, receiveCallBack, tcpReceiveCallback) {
  Layer2Device.call(this, interfaces, receiveCallBack)
  this.arp = []
  this.route = []
  this.sequence = 0
  this.tcp = {}

  if (typeof receiveCallBack === 'function') {
    this.receiveCallBack = receiveCallBack
  }
  if (typeof tcpReceiveCallback === 'function') {
    this.tcpReceiveCallback = tcpReceiveCallback
  }

  return this
}
(function() {
  /* derived */
  Layer3Device.prototype = Object.create(Layer2Device.prototype)

  /**
   * L3 パケットの受信
   * TODO: 巨大になったら分割
   * @param {Interface} srcPort 外部から受信したインターフェイス
   * @param {object}    recv    受信データ
   */
  Layer3Device.prototype.receive = function(srcPort, recv) {

    // L2ポートである場合はL2スイッチと同様の動作
    if (srcPort.isSwitchPort) {
      return Layer2Device.prototype.transfer.call(this, srcPort, new MAC(recv.sourceMACAddress), new MAC(recv.destinationMACAddress), recv)
    }

    if (recv.data.protocol === 'arp' && recv.data.operation === '1') {
      //var sender = srcPort.getConnection().otherSide(srcPort)
      return this.sendARPResponse(srcPort, recv)
    }

    if (recv.data.protocol === 'arp' && recv.data.operation === '2') {
      //var recievedInterface = srcPort.getConnection().otherSide(srcPort)
      return this.arp.push([srcPort.name, recv.data.sourceIPAddress, recv.data.sourceMACAddress, 'dynamic'])
    }

    var L3packet = recv.data

    // receive ICMP Echo reply
    if (L3packet.data.protocol === 'icmp' && L3packet.data.type === 8) {
      return this.sendICMPEchoReply(srcPort, recv)
    }

    // receive tcp
    if (L3packet.data.protocol === 'tcp') {

      if (this.tcp[L3packet.data.destinationPort] === undefined) {
        this.tcp[L3packet.data.destinationPort] = {}
      }

      // process tcp 3way handshake
      if (!L3packet.data.urg &&
        !L3packet.data.ack &&
        !L3packet.data.psh &&
        !L3packet.data.rst &&
        L3packet.data.syn &&
        !L3packet.data.fin
      ) {
        if (this.tcp[L3packet.data.destinationPort].status === undefined ||
           this.tcp[L3packet.data.destinationPort].status === 'LISTEN')
        {
          this.tcp[L3packet.data.destinationPort].status = 'SYN_RECEIVED'
          return this.sendTCPAckSyn(srcPort, recv)
        }
        else if (this.tcp[L3packet.data.destinationPort].status === 'ESTABLISHED') {
          if (this.tcpReceiveCallback) {
            this.tcpReceiveCallback(srcPort, recv)
          }
          return this.sendTCPAck(srcPort, recv)
        }
      }


      if (!L3packet.data.urg &&
        L3packet.data.ack &&
        !L3packet.data.psh &&
        !L3packet.data.rst &&
        L3packet.data.syn &&
        !L3packet.data.fin
      ) {
        if (this.tcp[L3packet.data.destinationPort].status === 'SYN_SENT') {
          this.tcp[L3packet.data.destinationPort].status = 'ESTABLISHED'
          return this.sendTCPAck(srcPort, recv)
        }
      }


      if (!L3packet.data.urg &&
        L3packet.data.ack &&
        !L3packet.data.psh &&
        !L3packet.data.rst &&
        !L3packet.data.syn &&
        !L3packet.data.fin
      ) {
        if (this.tcp[L3packet.data.destinationPort].status === 'SYN_RECEIVED') {
          this.tcp[L3packet.data.destinationPort].status = 'ESTABLISHED'
          return true
        }
      }
    }


    if (this.receiveCallBack) {
      return this.receiveCallBack(srcPort, recv)
    } else {
      // ルーティング
      return this.transfer(srcPort, recv)
    }
  }


  /**
   * 受信したパケットを装置内の他のインターフェイスに転送する(ルーティング)
   * @param {Interface} srcPort 外部からのデータを受信したインターフェイス
   * @param {object}    packet  受信データ
   */
  Layer3Device.prototype.transfer = function(srcPort, frame) {

    // ルーティングテーブルを参照し、該当するルートを選択する
    var route = this._refRoutingTable(new IPv4(frame.data.destinationIPAddress))
    if (!route)
      return false// 適切なルートが存在しないためパケット破棄

    var nextHopAddr
    // if nextHop is IP address
    if (IPv4.isValid(route.nextHop)) {
      nextHopAddr = new IPv4(route.nextHop)
      this.sendARPRequest(this.getInterface(route.portName), nextHopAddr)
    } else {
      // if nextHop is interface name
      nextHopAddr = new IPv4(frame.data.destinationIPAddress)
      this.sendARPRequest(this.getInterface(route.nextHop), nextHopAddr)
    }


    var nextHopMAC
    var nextSrcPortName
    for (var i = 0; i < this.arp.length; i++) {
      var arp = this.arp[i]
      if (nextHopAddr.equal(arp[1])) {
        nextSrcPortName = arp[0]
        nextHopMAC = new MAC(arp[2])
        break
      }
    }
    if (!nextHopMAC)
      return false// MACアドレスが見つからなかったためパケット破棄

    var packet = {
      'sourceIPAddress' : frame.data.sourceIPAddress,
      'destinationIPAddress' : frame.data.destinationIPAddress,
      'data' : frame.data.data
    }

    return Layer2Device.prototype.send.call(this, nextSrcPortName, nextHopMAC, packet)
  }


  /**
   * IPアドレスの設定
   */
  Layer3Device.prototype.setIP = function(ifname_and_ip) {
    if (!(ifname_and_ip instanceof Array))
      return this

    for (var i=0; i < ifname_and_ip.length; i++) {
      this.getInterface(ifname_and_ip[i][0]).ip = new IPv4(ifname_and_ip[i][1])
      this.getInterface(ifname_and_ip[i][0]).mask = (ifname_and_ip[i][2]) ? new IPv4(ifname_and_ip[i][2]) : new IPv4('255.255.255.255')
      this.getInterface(ifname_and_ip[i][0]).isSwitchPort = false
    }

    this._addDirectConnectionRoute()
    return this
  }

  /**
   * スタティックルーティングの設定
   */
  Layer3Device.prototype.setRoute = function(route) {
    if (typeof route === 'object' || route instanceof Array) {
      if (route.length > 0 && !(route[0] instanceof Route))
        throw new Error('bad type')
      Array.prototype.push.apply(this.route, route)
    }
    if (route instanceof Route)
      this.route.push(route)
    return this
  }

  /**
   * 宛先IPアドレスに対してデータを送信する
   * @param {string} srcPortName
   * @param {IPv4}    destIPaddr
   * @param {object}  data
   * @param {IPv4} srcIPaddr
   */
  Layer3Device.prototype.send = function(srcPortName, destIPaddr, data, srcIPaddr) {

    if (typeof srcPortName !== 'string')
      { throw new Error('bad type') }
    if (!(srcIPaddr instanceof IPv4 || srcIPaddr === undefined))
      { throw new Error('bad type') }
    if (!(destIPaddr instanceof IPv4))
      { throw new Error('bad type') }

    if (srcIPaddr === undefined) {
      srcIPaddr = this.getInterface(srcPortName).ip
    }

    var route = this._refRoutingTable(destIPaddr)
    if (!route)
      return false // 適切なルートが存在しないためパケット破棄

    // same network range if nexthop is string
    var nextHopAddr
    if (IPv4.isValid(route.nextHop)) {
      nextHopAddr = new IPv4(route.nextHop)
    } else {
      nextHopAddr = destIPaddr
    }

    // ARPキャッシュを参照
    var nextHopMAC
    this.arp.forEach(function(arp) {
      if (nextHopAddr.equal(arp[1])) {
        nextHopMAC = new MAC(arp[2])
        return
      }
    })
    if (!nextHopMAC){
      // ARPキャッシュに見つからなかった場合はARPリクエストを送信
      this.sendARPRequest(this.getInterface(srcPortName), nextHopAddr)
      this.arp.forEach(function(arp) {
        if (nextHopAddr.equal(arp[1])) {
          nextHopMAC = new MAC(arp[2])
          return
        }
      })
      if (!nextHopMAC)
        return false // MACアドレスが見つからないため、パケット破棄
    }


    var packet = {
      'sourceIPAddress' : srcIPaddr,
      'destinationIPAddress' : destIPaddr,
      'data' : data
    }

    return Layer2Device.prototype.send.call(this, srcPortName, nextHopMAC, packet)
  }

  /**
   * ARPリクエストを送信する
   * @param {Interface} srcPort 送信するインターフェイス
   * @param {IPv4}      resolveTarget 対象IPアドレス
   */
  Layer3Device.prototype.sendARPRequest = function(srcPort, resolveTarget) {

    var arpReq = {
      'protocol' : 'arp',
      'operation' : '1',
      'sourceIPAddress' : srcPort.ip.str(),
      'sourceMACAddress' : srcPort.mac.str(),
      'destinationIPAddress' : new IPv4(resolveTarget).str(),
      'destinationMACAddress' : '00-00-00-00-00-00'
    }
    return Layer2Device.prototype.send.call(this, srcPort.name, new MAC('ff-ff-ff-ff-ff-ff'), arpReq)
  }

  /**
   * ARP応答を送信する
   * @param {Interface} srcPort    送信するポート
   * @param {object}    recv       ARPリクエストを含むデータ
   */
  Layer3Device.prototype.sendARPResponse = function(srcPort, recv) {

    // 問い合わせIPアドレスを持っていなければ応答しない
    if (!srcPort.ip || !srcPort.ip.equal(recv.data.destinationIPAddress))
      return false

    var arpRes = {
      'protocol' : 'arp',
      'operation' : '2',
      'sourceIPAddress' : srcPort.ip.str(),
      'sourceMACAddress' : srcPort.mac.str(),
      'destinationIPAddress' : recv.data.sourceIPAddress,
      'destinationMACAddress' : recv.data.sourceMACAddress
    }
    return Layer2Device.prototype.send.call(this, srcPort.name, new MAC(arpRes.destinationMACAddress), arpRes)
  }

  /**
   * ICMPを送信する
   */
  Layer3Device.prototype.sendICMPEcho = function(srcPortName, targetIP, sequence) {

    var icmpReq = {
      'protocol' : 'icmp',
      'type' : 8, // icmp echo
      'code' : 0,
      'checksum' : 'dummy',
      'identifier' : 0,
      'sequence' : sequence,
      'data' : 'abcdefghijklmnopqrstuvwabcdefghi'
    }
    return this.send(srcPortName, targetIP, icmpReq)
  }

  /**
   * ICMP Echo Reply
   *
   */
  Layer3Device.prototype.sendICMPEchoReply = function(srcPort, recv) {
    var icmpRes = {
      'protocol' : 'icmp',
      'type' : 0, // icmp echo reply
      'code' : 0,
      'checksum' : 'dummy',
      'identifier' : 0,
      'sequence' : recv.data.data.sequence,
      'data' : 'abcdefghijklmnopqrstuvwabcdefghi'
    }
    return this.send(srcPort.name, recv.data.sourceIPAddress, icmpRes)
  }

  /**
   * TCP 送信
   */
  Layer3Device.prototype.sendTCP = function(ip, srcPort, destPort, data) {
    if (!this.interfaces) return false
    if (!this.interfaces[0].ip) return false
    if (typeof srcPort !== 'number') return false
    if (0 > srcPort || 65535 < srcPort) return false
    if (0 > destPort || 65535 < destPort) return false

    var route = this._refRoutingTable(ip)
    if (!route)
      return false

    var packet = {
      'protocol' : 'tcp',
      'sourcePort' : srcPort,
      'destinationPort' : destPort,
      'sequence' : ++this.sequence,
      'acknowledgment' : 0,
      'urg' : false,
      'ack' : false,
      'psh' : false,
      'rst' : false,
      'syn' : true,
      'fin' : false,
    }
    this.sequence += 160
    if (!this.tcp[srcPort]) this.tcp[srcPort] = {}
    this.tcp[srcPort].status = 'SYN_SENT'
    if (this.send(this.interfaces[0].name, ip, packet)) {
      console.log("tcp 3way handshake is done")
      packet.data = data
      this.send(this.interfaces[0].name, ip, packet)
    }
  }

  Layer3Device.prototype.sendTCPAckSyn = function(srcPort, recv) {
    this.sequence += 160
    var packet = {
      'protocol' : 'tcp',
      'sourcePort' : recv.data.data.destinationPort,
      'destinationPort' : recv.data.data.sourcePort,
      'sequence' : this.sequence+1,
      'acknowledgment' : this.sequence+1,
      'urg' : false,
      'ack' : true,
      'psh' : false,
      'rst' : false,
      'syn' : true,
      'fin' : false,
    }
    return this.send(this.interfaces[0].name, recv.data.sourceIPAddress, packet)
  }

  Layer3Device.prototype.sendTCPAck = function(srcPort, recv) {
    this.sequence += 160
    var packet = {
      'protocol' : 'tcp',
      'sourcePort' : recv.data.data.destinationPort,
      'destinationPort' : recv.data.data.sourcePort,
      'sequence' : this.sequence+1,
      'acknowledgment' : recv.data.data.sequence+161,
      'urg' : false,
      'ack' : true,
      'psh' : false,
      'rst' : false,
      'syn' : false,
      'fin' : false,
    }
    return this.send(this.interfaces[0].name, recv.data.sourceIPAddress, packet)
  }

  /**
   * private
   * 直接接続ルートの追加 ( ip/32 と ip & mask を追加)
   */
  Layer3Device.prototype._addDirectConnectionRoute = function() {
    for (var i = 0; i < this.interfaces.length; i++) {
      var val = this.interfaces[i]
      this.route.push(new Route('direct', val.ip, new IPv4('255.255.255.255'), val.name, val.name, 0))
      this.route.push(new Route('direct', val.ip.networkAddr(val.mask), val.mask, val.name, val.name, 0))
    }
  }


  /**
   * private
   * ルーティングテーブルを参照し、該当するルートを取得する。
   */
  Layer3Device.prototype._refRoutingTable = function(destAddr) {
    if (!(destAddr instanceof IPv4))
      throw new Error('bad type')

    var longest = 0 >>> 0, longestMatchRoute
    for (var i=0; i < this.route.length; i++) {
      var route = this.route[i]
      if ((route.net.uint() & route.mask.uint()) === (destAddr.uint() & route.mask.uint())) {
        if (longest <= route.mask.uint()) {
          longestMatchRoute = route
          longest = route.mask.uint()
        }
      }
    }
    return longestMatchRoute
  }



})()
Layer3Device.prototype.constructor = Layer3Device


/**
 * 共通処理
 */
 function isInteger(x) {
   return Math.round(x) === x
 }

 function clone(obj) {
   if (obj === null || typeof obj !== 'object') return obj;
   var copy = obj.constructor();
   for (var attr in obj) {
     if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
   }
   return copy;
 }


/**
 * Rangeオブジェクト
 */
function Range(begin, end) {
  if (!isInteger(begin) || !isInteger(end)) return null
  this.begin = begin
  this.end = end
}
(function() {
  Range.prototype.intersect = function(range) {
    if (!(range instanceof Range)) return

    var begin = (this.range.begin > range.begin) ?
                    this.range.begin : range.begin
    var end   = (this.range.end < range.end) ?
                    this.range.end : range.end

    if (begin > end) return []

    return new Range(begin, end)
  }

  /**
   * begin ~ end を配列で返す
   */
  Range.prototype.array = function() {
    var arr = []
    for (var i = this.begin; i < this.end; ++i) {
      arr.push(i)
    }
    return arr
  }
})
