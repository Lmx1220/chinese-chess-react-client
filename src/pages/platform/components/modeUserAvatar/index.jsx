import { Image as AntImage, CenterPopup, Toast } from 'antd-mobile'
import { ImagePicker } from 'antd-mobile-v2'
import { Component } from 'react'
import AdvancedBtn from '@/button/index.jsx'
import SocketEvent from '@/service/event.js'
import AdvancedSpin from '@/spinner/index.jsx'
import { CACHE_BATTLE_KEY } from '@/utils/cache-key-utils.js'
import { avatarList } from '@/utils/images-res.js'
import { btnSound, playSound } from '@/utils/sounds-res.js'
import styles from './index.module.less'

class ModeUserAvatar extends Component {
  constructor(props) {
    super(props)
    this.changeAvatar = (selectAvatar) => {
      this.setState({
        selectAvatar,
      })
    }
    this.handleSelectAvatar = async () => {
      const { selectAvatar } = this.state
      if (!selectAvatar) {
        Toast.show('请选择喜欢的头像')
        return
      }

      const { userId } = this.props
      const { type, id, url } = selectAvatar

      if (type === this.typeSystemAvatar) {
        const fileName = url.substr(url.lastIndexOf('/') + 1)
        const fileExtension = fileName.substr(fileName.lastIndexOf('.') + 1)
        const base64 = await this.getImageBase64(url)

        SocketEvent.emit('uploadPictureApi', {
          userId,
          fileName,
          base64,
          contentType: `image/${fileExtension}`,
          fileSize: 1,
        }, (response) => {
          if (response.code === 'success') {
            const fileUid = response.data.fileUid
            this.savePicture('0002', fileUid)
          }
          else {
            Toast.show(response.msg)
            this.setState({ loading: false })
          }
        })
      }
      else {
        this.savePicture('0001', id)
      }
    }

    this.savePicture = async (iconType, iconUrl) => {
      const { userId } = this.props
      this.setState({
        loading: true,
        text: '保存中',
      })

      SocketEvent.emit('modifyUserDetailApi', {
        userId,
        modifyDetail: { iconUrl, iconType },
      }, (response) => {
        this.setState({
          loading: false,
        })

        if (response.code === 'success') {
          Toast.show('保存成功')
          sessionStorage.removeItem(CACHE_BATTLE_KEY)
          this.props.goBack()
        }
        else {
          Toast.show(response.msg)
        }
      })
    }

    this.getImageBase64 = async (url) => {
      return new Promise((resolve) => {
        const img = new Image()
        img.src = url
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, img.width, img.height)
          const dataURL = canvas.toDataURL('image/png')
          resolve(dataURL)
        }
      })
    }
    this.updateIconUrl = async (files) => {
      if (files.length > 0) {
        const [fileData] = files
        const { file, url } = fileData
        if (file.size >= 1e6) {
          Toast.show('文件过大(限制1M)')
          return
        }

        this.setState({
          loading: true,
          text: '头像上传中',
        })

        SocketEvent.emit('uploadPictureApi', {
          userId: this.props.userId,
          fileName: file.name,
          base64: url,
          contentType: file.type,
          fileSize: file.size,
        }, (response) => {
          console.log('上传头像返回：', response)
          this.setState({
            loading: false,
          })
          if (response.code === 'success') {
            const fileUid = response.data.fileUid
            Toast.show('上传成功')

            this.setState({
              selectAvatar: {
                id: fileUid,
                url,
                type: this.typeUploadAvatar,
              },
            })
          }
          else {
            Toast.show(response.msg)
            this.setState({
              loading: false,
            })
          }
        })
      }
    }
    this.scaleAvatar = () => {
      const { selectAvatar } = this.state
      if (selectAvatar) {
        this.setState({ scaleAvatarShow: true })
      }
    }

    this.typeSystemAvatar = 'systemAvatar'
    this.typeUploadAvatar = 'uploadAvatar'
    this.state = {
      text: '',
      loading: false,
      avatarList: [],
      selectAvatar: null,
      scaleAvatarShow: false,
    }
  }

  componentDidMount() {
    this.setState({
      avatarList,
    })
  }

  componentWillUnmount() {
  }

  render() {
    const { avatarList, selectAvatar, scaleAvatarShow } = this.state

    return (
      <>
        <div className={styles.userAvatar}>
          <div className={styles.title}>
            选择头像
          </div>
          <div className={styles.head}>
            <div className={styles.userIcon}>
              <AntImage
                src={selectAvatar?.url}
                style={{
                  borderRadius: 45,
                  border: '1px solid #eee',
                }}
                fit="cover"
                width={90}
                height={90}
                onClick={this.scaleAvatar}
              />
            </div>
            <div className={styles.upload}>
              <span onClick={() => playSound(btnSound)}>
                不满意？赶快上传！
              </span>
              <ImagePicker
                length="1"
                className={styles.imgPicker}
                onFail={error => Toast.show(error)}
                onChange={this.updateIconUrl}
                disableDelete
                accept="image/gif,image/jpeg,image/jpg,image/png"
              />
            </div>
          </div>
          <div className={styles.avatar}>
            {avatarList.map(avatar => (
              <div
                className={selectAvatar?.url === avatar.url ? styles.itemSelect : styles.item}
                onClick={() => this.changeAvatar(avatar)}
                key={avatar.url}
              >
                <AntImage src={avatar.url} fit="cover" />
              </div>
            ))}
          </div>
          <div className={styles.btn}>
            <div className={styles.tip}>
              小提示：在个人中心也可以更换头像哦~
            </div>
            <div className={styles.selectBtn}>
              <AdvancedBtn
                type="square"
                onClick={this.handleSelectAvatar}
                text="确定"
              />
            </div>
          </div>
        </div>

        <CenterPopup
          visible={scaleAvatarShow}

          style={{ '--background-color': 'transparent' }}
          onMaskClick={() => this.setState({ scaleAvatarShow: false })}
        >
          <img
            src={selectAvatar?.url}
            width="100%"
            height="100%"
            alt=""
          />
        </CenterPopup>

        <AdvancedSpin
          text={this.state.text}
          show={this.state.loading}
        />
      </>
    )
  }
}

export default ModeUserAvatar
