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
    this.mac = macAddrMatch1.map((v) => {return parseInt(v, 16)})
    this.mac = this.mac.slice(1)
    return
  }

  // FFFF:FFFF:FFFF のパターンマッチ
  // FFFF.FFFF.FFFF のパターンマッチ
  var macAddrMatch2 = macAddr.match(/^([0-9a-fA-F]{2})([0-9a-fA-F]{2})[:.]([0-9a-fA-F]{2})([0-9a-fA-F]{2})[:.]([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/)
  if (typeof macAddr === 'string' && macAddrMatch2) {
    this.mac = macAddrMatch2.map((v) => {return parseInt(v, 16)})
    this.mac = this.mac.slice(1)
    return
  }
}
(function(){

  /**
   * MACアドレスを文字列形式で返す
   *  (書式: 00:00:00:00:00:00)
   */
  MAC.prototype.str = function() {
    return ('0'+this.mac[0].toString(16)).slice(-2)
      +':'+('0'+this.mac[1].toString(16)).slice(-2)
      +':'+('0'+this.mac[2].toString(16)).slice(-2)
      +':'+('0'+this.mac[3].toString(16)).slice(-2)
      +':'+('0'+this.mac[4].toString(16)).slice(-2)
      +':'+('0'+this.mac[5].toString(16)).slice(-2)
  }

  /**
   * 比較
   */
  MAC.prototype.equals = function(to) {
    var cmp = new MAC(to)
    for (var i=0; i<cmp.mac.length; i++) {
      if (this.mac[i] != cmp.mac[i])
        return false
    }
    return true
  }

}())

/**
 * ネットワークインターフェイス
 * @param {string}      name             インターフェイス名
 * @param {MAC}         mac              MACアドレス
 * @param {number}      vlan             VLAN_ID(0-4095)、default:1
 * @param {boolean}     isTrunk          true:トランクポート, false:アクセスポート(default)
 * @param {array|Range} trunkAllowedVlan トランクポート時許可するvlanの配列もしくは範囲
 */
function Interface(name, vlan = 1, isTrunk = false, trunkAllowedVlan = null) {

  this.name = name
  this.vlan = vlan
  this.isConnect = false
  this.isTrunk = isTrunk
  this.trunkAllowedVlan = (trunkAllowedVlan) ? trunkAllowedVlan : new Range(0, 4095)
}
(function(){

  /**
   * インターフェイス接続
   * @param {Interface} to 接続先
   */
  Interface.prototype.connect = function(to) {
    if (this.isConnect) { throw new Error('interface already connected')}
    if (!this.connection) this.connection = new Connection()

    // 双方向で接続
    this.connection.connect(to)
    to.connection = this.connection
    to.connection.connect(this)
    this.isConnect = true
    to.isConnect = true
  }

  /**
   * インターフェイス切断
   * @param {Interface} from 接続先
   */
  Interface.prototype.disconnect = function(from) {
    if (!this.connection) { throw new Error('call disconnect(), but IF is null') }

    // 双方向で切断
    this.connection.disconnect(from)
    from.connection.disconenct(this)
    this.connection = null
    this.isConnect = false
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
    if (!this.isConnect) return

    this.connection.transfer(this, data)
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
 * @param {Array(Interface)} interfaces      保持するインターフェイスの配列
 * @param {function}         receiveCallBack 受信したデータを処理するコールバック関数
 */
function Layer2Device(interfaces, receiveCallBack) {

  this.interfaces = interfaces
  for (var i=0; i < this.interfaces.length; i++) {
    this.interfaces[i].device = this
  }
  this.macAddrTable = []

  // 受信したデータの処理方法
  if (receiveCallBack) {
    this.receiveCallback = receiveCallBack
  }

  return this
}
(function(){

  /* データ受信コールバック関数が定義されていない場合のデフォルト動作
   * 他のインターフェイスにフレームを転送する動作をする(L2スイッチ)
   * @param {Interface} srcDevice 送信元デバイスのインターフェイス
   * @param {object}    recv      受信データ
   */
  Layer2Device.prototype.receive = function(srcDevice, recv) {

    if (this.receiveCallback) {
      this.receiveCallback(srcDevice, recv)
      return
    }

    var srcSwitchPort = srcDevice.getConnection().otherSide(srcDevice)
    this.transfer(srcSwitchPort, new MAC(recv.sourceMACAddress), new MAC(recv.destinationMACAddress), recv)
  }

  /**
   * MACアドレスの設定
   * (e.g.)
   * var L2 = new Layer2Device(...).setMAC([['eth0', '00-00-00-00-00-00']])
   */
  Layer2Device.prototype.setMAC = function(ifname_and_mac) {
    if (!(ifname_and_mac instanceof Array)) return this
    for (let i=0; i < ifname_and_mac.length; i++) {
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
    if (!(to instanceof Interface)) throw new Error('bad connect')
    this.getInterface(ifname).connect(to)
  }

  /**
   * インターフェイスから切断する
   * @param {string} ifname
   * @param {string} from
   */
  Layer2Device.prototype.disconnect = function(ifname, from) {
    if (!(from instanceof Interface)) throw new Error('bad connect')
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
  Layer2Device.prototype.send = function(srcPortName, destMAC, data, srcMAC = null) {

    if (typeof srcPortName !== 'string') { throw new Error('bad type') }
    if (!(srcMAC instanceof MAC || srcMAC == null)) { throw new Error('bad type') }
    if (!(destMAC instanceof MAC)) { throw new Error('bad type') }

    if (srcMAC == null) {
      srcMAC = this.getInterface(srcPortName).mac
    }

    var frame = {
        'sourceMACAddress' : srcMAC.str(),
        'destinationMACAddress' : destMAC.str(),
        'data' : data
    }

    for (var i=0; i < this.interfaces.length; i++) {
      if (srcPortName === this.interfaces[i].name) {
        this.interfaces[i].getConnection().transfer(this.interfaces[i], frame)
        return
      }
    }
  }

  /**
   * 受信したL2フレームを宛先MACアドレスからデバイス内の別ポートに転送する
   * @param {object} srcPort 送信元ポート名
   * @param {MAC}    srcMAC  送信元MACアドレス
   * @param {MAC}    destMAC 宛先MACアドレス
   * @param {object} frame   送信データ
   */
  Layer2Device.prototype.transfer = function(srcPort, srcMAC, destMAC, frame) {

    this._addMacTable(srcPort.name, srcMAC)

    // ブロードキャストを処理
    if (destMAC.equals('ff-ff-ff-ff-ff-ff')) {
      this._sendBroadcast(srcPort, this.interfaces, frame)
      return
    }

    // ユニキャスト
    var destPort = this._searchPort(destMAC)
    if (destPort.length) {
      frame = this._processVlan(srcPort, destPort[0], frame)
      if (frame)
        destPort[0].transfer(frame)
    } else {
      // MACテーブルに登録されていないのでブロードキャストする
      this._sendBroadcast(srcPort, this.interfaces, frame)
    }
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
      if (macObj.equals(this.macAddrTable[i][1])) {
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
      if (ifname == this.macAddrTable[i][0] && mac_obj.equals(this.macAddrTable[i][1]))
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
      if (srcPort.name == interfaces[i].name) continue

      var processedFrame = this._processVlan(srcPort, interfaces[i], frame)
      if (processedFrame)
        interfaces[i].transfer(processedFrame)
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

    if (srcPort.isTrunk) {

      if (destPort.isTrunk) {

        var vlanArray;
        if (destPort.trunkAllowedVlan instanceof Range)
          vlanArray = destPort.trunkAllowedVlan.array()
        else {
          vlanArray = destPort.trunkAllowedVlan
        }

        if (vlanArray.indexOf(frame.vid) < 0)
          return // (d)
      } else {
        // if destPort is access port
        if (frame.vid != destPort.vlan)
          return
        delete frame.vid // (c)
      }

    } else {
      // if srcPort is access port
      if (destPort.isTrunk) {

        var vlanArray;
        if (destPort.trunkAllowedVlan instanceof Range)
          vlanArray = destPort.trunkAllowedVlan.array()
        else
          vlanArray = destPort.trunkAllowedVlan

        if (vlanArray.indexOf(srcPort.vlan) < 0)
          return
        frame.vid = srcPort.vlan // (b)

      } else {
        // if destPort is access port
        if (srcPort.vlan != destPort.vlan)
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
    var portList = [], ifList = []
    var macObj = new MAC(mac)
    for (var i=0; i < this.macAddrTable.length; i++) {
      if(macObj.equals(this.macAddrTable[i][1])) {
        portList.push(this.macAddrTable[i][0])
      }
    }
    if (portList.length) {
      for (var i=0; i < portList.length; i++) {
        ifList.push(this.getInterface(portList[i]))
      }
    }
    return ifList
  }
}())

/**
 * インターフェイス間の物理的・論理的接続を表現するクラス
 */
function Connection() {
  this.connected = []
}
(function(){
  Connection.prototype.connect = function($interface) {
    if (this.connected.length > 2) throw new Error("too many connection")
    this.connected.push($interface)
  }

  Connection.prototype.disconnect = function($interface) {
    for (var i in this.connected) {
      if (this.connected[i] === $interface) {
        this.connected.splice(i, 1)
      }
    }
  }

  Connection.prototype.connected = function() {
    return this.connected
  }

  /**
   * データをConnectionの対向側に転送する
   * @param {object} src  送信元インターフェイス
   * @param {object} data 送信データ
   */
  Connection.prototype.transfer = function(src, data) {
    var dest = this.otherSide(src)
    if (dest == null) throw new Error('connection not established : ' + e)
    if (dest.device.constructor.name == 'Layer3Device')
      console.log(dest.device.constructor.name)
    dest.device.receive(src, data)
  }

  Connection.prototype.otherSide = function(one) {
    return (one == this.connected[0]) ? this.connected[1] : this.connected[0]
  }
}())
var i = 0
