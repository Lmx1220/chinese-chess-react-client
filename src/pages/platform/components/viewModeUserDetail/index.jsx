import { Dialog, Image, List, Space, Toast } from 'antd-mobile'
import { ImagePicker, Modal } from 'antd-mobile-v2'
import ClipboardJS from 'clipboard'
import { Component } from 'react'
import SocketEvent from '@/service/event.js'
import AdvancedSpin from '@/spinner/index.jsx'
import { CACHE_BATTLE_KEY } from '@/utils/cache-key-utils.js'
import { btnSound, playSound } from '@/utils/sounds-res.js'
import styles from './index.module.less'

class ViewModeUserDetail extends Component {
  constructor(props) {
    super(props)
    this.updateIconUrl = (files) => {
      const userId = this.props.userId
      playSound(btnSound)
      if (files.length > 0) {
        const [fileData] = files
        const { file, url } = fileData

        if (file.size >= 1e6) {
          return Toast.show('文件过大(限速1M)')
        }

        this.setState({
          loading: true,
          text: '头像上传中',
        })

        SocketEvent.emit('uploadPictureApi', {
          userId,
          fileName: file.name,
          base64: url,
          contentType: file.type,
          fileSize: file.size,
        }, (response) => {
          console.log('上传头像返回：', response)

          if (response.code === 'success') {
            const { fileUid } = response.data

            SocketEvent.emit('modifyUserDetailApi', {
              userId,
              modifyDetail: {
                iconUrl: fileUid,
                iconType: '0001',
              },
            }, (res) => {
              this.setState({ loading: false })
              if (res.code === 'success') {
                Toast.show('上传成功')
                sessionStorage.removeItem(CACHE_BATTLE_KEY)
                this.props.queryUserDetail()
              }
              else {
                Toast.show(res.msg)
              }
            })
          }
          else {
            Toast.show(response.msg)
            this.setState({ loading: false })
          }
        })
      }
    }

    this.updateUserName = () => {
      playSound(btnSound)
      const warningMessage = (
        <div style={{ fontSize: '13px', color: '#bbb' }}>
          名称不能超过五个字
        </div>
      )

      Modal.prompt('请输入新昵称', warningMessage, [
        {
          text: '取消',
          onPress: () => playSound(btnSound),
        },
        {
          text: '修改',
          onPress: (newName) => {
            playSound(btnSound)
            if (newName.length === 0 || newName.length > 5) {
              Toast.fail('昵称无效')
            }
            else {
              const userId = this.props.userId
              SocketEvent.emit('modifyUserDetailApi', {
                userId,
                modifyDetail: { userName: newName },
              }, (response) => {
                if (response.code === 'success') {
                  Toast.show('修改成功')
                  sessionStorage.removeItem(CACHE_BATTLE_KEY)
                  this.props.queryUserDetail()
                }
                else {
                  Toast.show(response.msg)
                }
              })
            }
          },
        },
      ])
    }

    this.handleCopyUserId = (userId) => {
      const copyContent = (
        <div style={{ lineHeight: '22px', color: 'red', fontSize: '15px', marginTop: '10px' }}>
          *点击内容进行复制*
        </div>
      )
      const userIdBox = (
        <div style={{ border: 'dashed 1px #bebebe', borderRadius: '5px', padding: '15px 0' }}>
          {`您的账号：${userId}`}
        </div>
      )
      const copyBox = (
        <div data-clipboard-text={userId} className="copy" onClick={() => playSound(btnSound)}>
          {userIdBox}
          {copyContent}
        </div>
      )

      const alertInstance = Modal.alert('系统提示', copyBox, [])
      const clipboard = new ClipboardJS('.copy')

      clipboard.on('success', () => {
        Toast.show('已复制')
        alertInstance.close()
      })

      clipboard.on('error', () => {
        Toast.show('复制失败')
        alertInstance.close()
      })
    }

    this.goLoginOut = () => {
      playSound(btnSound)
      Dialog.confirm({
        title: '系统提示',
        content: '确认退出吗？',
        confirmText: '确认',
        cancelText: '取消',
        onConfirm: () => {
          playSound(btnSound)
          SocketEvent.emit('loginOutApi', { userId: this.props.userId }, (response) => {
            console.log('退出登录resp:', response)
            this.props.goLoginOut()
          })
        },
        onCancel: () => {
          playSound(btnSound)
        },
      })
    }

    this.state = {
      text: '',
      loading: false,
    }
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  render() {
    const user = this.props.user
    return (
      <>
        <div className={styles.userDetail}>
          <div className={styles.head}>
            <div className={styles.userIcon}>
              <Image
                src={user?.iconUrl}
                className={styles.img}
                fit="cover"
              />
              <ImagePicker
                className={styles.imgPicker}
                style={{ opacity: 0 }}
                length="1"
                onFail={error => Toast.show(error)}
                onChange={this.updateIconUrl}
                disableDelete
                accept="image/gif,image/jpeg,image/jpg,image/png"
              />
            </div>
            <div
              className={styles.close}
              onClick={this.props.goBack}
            >
              <div title="close" />
            </div>
          </div>

          <List>
            <List.Item
              onClick={() => {
                playSound(btnSound)
                this.handleCopyUserId(user?.userId)
              }}
              extra={user?.userId}
            >
              账号
            </List.Item>

            <List.Item
              onClick={this.updateUserName}
              extra={user?.userName}
            >
              昵称
            </List.Item>

            <List.Item
              onClick={() => {
                playSound(btnSound)
                Toast.show('排行榜未开放')
              }}
              extra={(
                <div className={styles.score}>
                  {user?.score}
                </div>
              )}
            >
              积分
            </List.Item>

            <List.Item
              onClick={() => {
                playSound(btnSound)
                Toast.show('功能未开放')
              }}
              extra={(
                <div className={styles.battle}>
                  <span>{user?.pkWinCount || '0'}</span>
                  /
                  <span>{user?.pkFailCount || '0'}</span>
                  /
                  <span>{user?.pkPeaceCount || '0'}</span>
                </div>
              )}
            >
              战绩
            </List.Item>

            <List.Item
              onClick={() => Toast.show('功能未开放')}
            >
              游戏规则
            </List.Item>
          </List>

          <Space />

          <List>
            <List.Item
              onClick={e => this.goLoginOut(e)}
            >
              切换账号
            </List.Item>

            <List.Item
              onClick={() => Toast.show('功能未开放')}
            >
              设置
            </List.Item>
          </List>
        </div>

        <AdvancedSpin
          text={this.state.text}
          show={this.state.loading}
        />
      </>
    )
  }
}

export default ViewModeUserDetail
