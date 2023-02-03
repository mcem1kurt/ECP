import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native'
import React, {useState, useEffect} from 'react'
import { firebase } from '../config'
import { TextInput } from 'react-native-paper'
import {Load} from "../assets/load.gif"

const Registration = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(true)
  const [url, setUrl] = useState("")

  useEffect(() => {
    const getLogo = async () => {
      const ref = firebase.storage().ref('assets/logo.gif');
      const url = await ref.getDownloadURL();
      setUrl(url)
    }
    getLogo();
  }, [])
    registerUser = async (email,password, firstName, lastName) => {
        await firebase.auth().createUserWithEmailAndPassword(email,password)
        .then(() => {
          firebase.auth().currentUser.sendEmailVerification({
            handleCodeInApp: true,
            url: 'https://expo-33883.firebaseapp.com',
           })
          .then(() => {
                alert("Email sent")
            }).catch((error) => {
                alert(error)
            })
            .then(() => {
              firebase.firestore().collection("users")
              .doc(firebase.auth().currentUser.uid)
              .set({
                  firstName,
                  lastName,
                  email,
              })
            })
            .catch((error) => {
              alert(error)
          })
        })
        .catch((error) => {
            alert(error)
        })
    }


  return (
    <View style={styles.container}>
      {url ? <Image style={styles.logo} resizeMode={'contain'} source={{uri: url} } onLoadStart={()=>{setLoading(true)}} onLoadEnd={()=>{setLoading(false)}} />
      :
        <ActivityIndicator size="large" color="black" style={styles.logo} />
        }
        <Text style={{fontWeight:'bold', fontSize:23,}}>
          Kayıt Ol
        </Text>
        <View style={{marginTop:20}}>
          <TextInput style={styles.textInput} 
              placeholder="Ad" 
              onChangeText={(firstName) => setFirstName(firstName)}
              autoCorrect={false}
              mode="outlined"
            underlineColor="transparent"
            theme={{ roundness: 30 }} 
          />
          <TextInput style={styles.textInput} 
            placeholder="Soyad" 
            onChangeText={(lastName) => setLastName(lastName)}
            autoCorrect={false}
            mode="outlined"
            underlineColor="transparent"
            theme={{ roundness: 30 }} 
          />
          <TextInput style={styles.textInput} 
            placeholder="E-Mail" 
            onChangeText={(email) => setEmail(email)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            mode="outlined"
            underlineColor="transparent"
            theme={{ roundness: 30 }} 
          />
          <TextInput style={styles.textInput} 
            placeholder="Şifre" 
            onChangeText={(password)=> setPassword(password)}
            autoCorrect={false}
            autoCapitalize="none"
            secureTextEntry={true}
            mode="outlined"
            underlineColor="transparent"
            theme={{ roundness: 30 }} 
          />
        </View>
        <TouchableOpacity
            onPress={()=>registerUser(email,password, firstName, lastName)}
            style={styles.button}
        >
          <Text style={{fontWeight:'bold', fontSize:22, color:"white"}}>Register</Text>
        </TouchableOpacity>
      </View>
  )
}

export default Registration

const styles = StyleSheet.create({
  container: {
    flex:1,  
    alignItems:'center',
    justifyContent:"center"
  },
  logo: {
    height:100,
    width:100,
  },
  textInput: {
    overflow:"hidden",
    width:340,
    fontSize: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,

    marginBottom: 10,
    textAlign: 'center',
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