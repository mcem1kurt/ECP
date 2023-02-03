import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native'
import React, {useState, useEffect} from 'react'
import { useNavigation } from '@react-navigation/native'
import { firebase } from '../config'
import { TextInput } from 'react-native-paper'
import Toast  from "../components/Toast"

const Login = () => {
    const navigation = useNavigation()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(true)
    const [url, setUrl] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    useEffect(() => {
      const getLogo = async () => {
        const ref = firebase.storage().ref('assets/logo.gif');
        const url = await ref.getDownloadURL();
        setUrl(url)
        setLoading(false)
      }
      getLogo();
    }, [])

    loginUser = async (email,password) => {
        try{
            await firebase.auth().signInWithEmailAndPassword(email,password)
        } catch (error){
          alert(error)
        }
    }

    // forget password
    const forgetPassword = () => {
        firebase.auth().sendPasswordResetEmail(email)
        .then(() => {
          setError("Şifre yenileme bağlantısı E-Mail adresinize gönderildi.")
        })
        .catch(error => {
          setError("Lütfen E-Mail adresinizi giriniz.")
        })
    }

    
    

    return (
      <View style={styles.container}>
        {url ? <Image style={styles.logo} resizeMode={'contain'} source={{uri: url} } onLoadStart={()=>{setLoading(true)}} onLoadEnd={()=>{setLoading(false)}} />
      :
        <ActivityIndicator size="large" color="black" style={styles.logo} />
        }
        <Text style={{fontWeight:'bold', fontSize:26,}}>
          Giriş Yap
        </Text>
        <View style={{marginTop:20}}>
          <TextInput style={styles.textInput} 
            placeholder="E-Mail" 
            onChangeText={(email) => setEmail(email)}
            autoCapitalize="none"
            mode="outlined"
            underlineColor="transparent"
            theme={{ roundness: 30 }} 
            autoCorrect={false}
          />
          <TextInput style={styles.textInput} 
            placeholder="Şifre" 
            onChangeText={(password)=> setPassword(password)}
            autoCorrect={false}
            mode="outlined"
            theme={{ roundness: 30,  }} 
            autoCapitalize="none"
            secureTextEntry={true}
          />
        </View>
        <TouchableOpacity
            onPress={()=>loginUser(email,password)}
            style={styles.button}
        >
          <Text style={{fontWeight:'bold', fontSize:22, color: "white"}}>Giriş Yap</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={()=>navigation.navigate('Registration')}
          style={{marginTop:20,}}
        >
          <Text style={{fontSize:16, fontWeight:'bold'}}>
            Henüz hesabın yok mu? Kayıt Ol
          </Text>
          
        </TouchableOpacity>
        <TouchableOpacity
          onPress={()=>{forgetPassword()}}
          style={{marginTop:20,}}
        >
          <Text style={{fontSize:16, fontWeight:'bold'}}>
            Şifremi Unuttum
          </Text>
          
        </TouchableOpacity>
        <Toast message={error} onDismiss={() => setError('')}/>
      </View>
    )
}

export default Login

const styles = StyleSheet.create({
  container: {
    flex:1,  
    alignItems:'center',
    justifyContent:"center"
  },
  textInput: {
    overflow:"hidden",
    width:340,
    fontSize: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderColor:"#ddd",
    marginBottom: 10,
    textAlign: 'center',
  },
  logo: {
    height:100,
    width:100,
    "mixBlendMode":"screen",
  },
  button: {
    marginTop:10,
    height:60,
    width:200,
    backgroundColor:'#4287f5',
    alignItems:'center',
    justifyContent:'center',
    borderRadius:50,
  }
});