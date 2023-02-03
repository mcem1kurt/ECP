import React, { useState, useEffect } from 'react'
import { Text, StyleSheet, SafeAreaView, View } from 'react-native'
import { firebase } from '../config'
import axios from 'axios'
import { load } from 'cheerio';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Map from './Map';
import Settings from './Settings';
import Profile from './Profile';
import Icon from 'react-native-dynamic-vector-icons';
import TabBar from "../components/Tabbar"

const Dashboard = () => {
  const navigation = useNavigation()

  const [name, setName] = useState([]);
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isActive, setIsActive] = useState(false)
  const [currentScreen, setCurrentScreen] = useState(undefined)


  const tabs = [
    {
      name: 'Profile',
      activeIcon: <Icon name="rocket" color="#fff" size={25} />,
      inactiveIcon: <Icon icon="rocket" color="#4d4d4d" size={25} />
    },
    
  ];



  useEffect(() => {
    const fetchDetails = async () => {
      firebase.firestore().collection("users").doc(firebase.auth().currentUser.uid).get()
      .then(async (snapshot) => {
        if (snapshot.exists) {
          setName(snapshot.data())
          await AsyncStorage.setItem('user', JSON.stringify(snapshot.data()));
        }
        else {
          console.log('does not exist')
        }
      })
    }
    fetchDetails()
  }, [currentScreen])

  // change the password
  useEffect(() => {
    if (isActive == "map") {
      setCurrentScreen(<Map currentUser={name} />)
    } else if (isActive == "profile") {
      setCurrentScreen(<Profile currentUser={name} />)
    } else if (isActive == "settings") {
      setCurrentScreen(<Settings />)
    }
  }, [isActive])


  const changePassword = () => {
    firebase.auth().sendPasswordResetEmail(firebase.auth().currentUser.email)
      .then(() => {
        alert('Password reset email sent!')
      })
      .catch(error => {
        alert(error)
      })
  }

  const setIsActiveHandler = (e) => {
    setIsActive(e)
  }

  

  let text = 'Waiting..';
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }


  return (
    <>
    {isActive && <Map/>}
    <TabBar setIsActive={setIsActiveHandler} />
    </>
  )
}

export default Dashboard

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  button: {
    marginTop: 50,
    height: 70,
    width: 250,
    backgroundColor: '#026efd',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});