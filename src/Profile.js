import { StyleSheet, Text, View, NativeModules, Image, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { FlatList, TextInput } from 'react-native-gesture-handler'
import { firebase } from '../config'
import Cars from './Cars'
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-dynamic-vector-icons';
import { Modal, Button } from 'react-native-paper'
import { useIsFocused } from '@react-navigation/native'

const Profile = () => {
  const [showListOfCars, setShowListOfCars] = useState(false)
  const [cars, setCars] = useState([])
  const [selectedCar, setSelectedCar] = useState({})
  const [modalVisible, setModalVisible] = useState(false)
  const [currentUserInformation, setCurrentUserInformation] = useState({})
  const isFocused = useIsFocused();
  const { StatusBarManager } = NativeModules;


  useEffect( () => {
    getAllCarsFromDatabase()
  },[])


  useEffect( () => {
    currentUserInfo()
  },[])

  useEffect(() => {
    const fetchDetails = async () => {
      await firebase.firestore().collection("users").doc(firebase.auth().currentUser.uid).get()
      .then(async (snapshot) => {
        if (snapshot.exists) {
          setCurrentUserInformation(snapshot.data())
          if (snapshot.data().carModel) {
            await getAllCarsFromDatabase()
            setSelectedCar(cars[cars.findIndex(item => item.model === snapshot.data().carModel)])
            setShowListOfCars(false)
          } else {
            setShowListOfCars(true)
            await getAllCarsFromDatabase()
          }
        }
      })
    }
    fetchDetails()
  }, [selectedCar, isFocused])
  


  const getAllCarsFromDatabase = async () => {

    try {
      const data = await AsyncStorage.getItem('evmodels');
      if (data !== null) {
        setCars(JSON.parse(data));
      } else {
        const cars = [];
        await firebase.firestore().collection('EV-Database').get()
          .then(querySnapshot => {
            querySnapshot.docs.forEach(doc => {
              cars.push(doc.data());
            });
          }).catch(er => console.log(er));

        await AsyncStorage.setItem('evmodels', JSON.stringify(cars));
        setCars(cars)
        console.log("Fetched from Firebase Firestore")
      }
    } catch (error) {
      console.error(error);
    }
  }

  const currentUserInfo = async () => {

    await firebase.firestore().collection("users").doc(firebase.auth().currentUser.uid).get()
      .then(async (snapshot) => {
        if (snapshot.exists) {
          setCurrentUserInformation(snapshot.data())
          if (snapshot.data().carModel) {
            await getAllCarsFromDatabase()
            setSelectedCar(cars[cars.findIndex(item => item.model === snapshot.data().carModel)])
            setShowListOfCars(false)
          } else {
            setShowListOfCars(true)
            await getAllCarsFromDatabase()
          }
        }
      })
  }







  const carItemSelectedHandler = async (model, brand, uri) => {
    const indexInCars = cars.findIndex(item => item.model === model)
    setSelectedCar(cars[indexInCars])
    setModalVisible(true)
    await currentUserInfo()
  }
  const acceptButtonHandler = async () => {
    await firebase.firestore().collection("users").doc(firebase.auth().currentUser.uid).update({ "carModel": selectedCar.model })
    setModalVisible(false)
    currentUserInfo()
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", paddingBottom: 95, paddingTop: 45 }} >

      {showListOfCars ?
        <>
          <Text style={{ textAlign: "center", margin: 10 }}>
            Aşağıdaki listeden araba modelinizi seçiniz.
          </Text>
          <TextInput
            placeholder='Ara'
            style={styles.search}
          />
          <FlatList
            fadingEdgeLength={200}
            data={cars}
            renderItem={({ item }) => <Cars brand={item.brand} model={item.model} uri={item.image} carItemSelectedHandler={carItemSelectedHandler} />}
            keyExtractor={item => item.model}
          />
        </> :
        <View style={{ flex: 1, justifyContent:"center" }}>
          <View style={styles.userCard}>
            <Image style={styles.pp} source={require("../assets/pp.png")} />
            <View>
              <Text >{currentUserInformation?.firstName?.charAt(0).toUpperCase() + currentUserInformation?.firstName?.slice(1)} {currentUserInformation?.lastName?.charAt(0).toUpperCase() + currentUserInformation?.lastName?.slice(1)}</Text>
              <Text style={{fontWeight:"300"}}>{currentUserInformation?.email}</Text>
            </View>
          </View>
          <View style={styles.userCarInfoCard}>
            <Image style={styles.image} source={{ uri: selectedCar?.image }} resizeMode="contain"/>

            <View style={{ backgroundColor: "white", }}>
              <View style={styles.carDetails}>
                <Text style={styles.brand}>{selectedCar?.brand}</Text>
                <Text style={styles.model}>{selectedCar?.model}</Text>
              </View>
              <ScrollView
                horizontal
                scrollEventThrottle={1}
                showsHorizontalScrollIndicator={false}
                height={130}
                style={styles.chipsScrollView}
                contentInset={{ // iOS only
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 20
                }}
                contentContainerStyle={{
                  paddingRight: Platform.OS === 'android' ? 20 : 0,
                }}
              >
                <View style={styles.chipsItem}>
                  <Text>Batarya</Text>
                  <Text>{selectedCar?.battery}</Text>
                </View >
                <View style={styles.chipsItem}>
                  <Text>Menzil</Text>
                  <Text>{selectedCar?.carRange}</Text>
                </View>
                <View style={styles.chipsItem}>
                  <Text>Verimlilik</Text>
                  <Text>{selectedCar?.efficiency}</Text>
                </View>
                <View style={styles.chipsItem}>
                  <Text>Maksimum Hız</Text>
                  <Text>{selectedCar?.topSpeed}</Text>
                </View>
                <View style={styles.chipsItem}>
                  <Text>0-100</Text>
                  <Text>{selectedCar?.zeroToHundred}</Text>
                </View>
                <View style={styles.chipsItem}>
                  <Text>Hızlı Şarj</Text>
                  <Text>{selectedCar?.fastCharge}</Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </View>

      }
      <Modal
        visible={modalVisible}
        dismissable
        onDismiss={() => { setModalVisible(false) }}
      >
        <View style={styles.cardContainer}>
          <Image style={styles.image} source={{ uri: selectedCar?.image }} resizeMode="cover" />
          <View style={styles.desc}>
            <View style={styles.carDetails}>
              <Text style={styles.brand}>{selectedCar?.brand}</Text>
              <Text style={styles.model}>{selectedCar?.model}</Text>
            </View>
            <Button
              buttonColor='#F8A302'
              textColor='white'
              mode='contained-tonal'
              icon="check"
              style={styles.button}
              onPress={() => { acceptButtonHandler() }}>
              Onayla
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  )
}

export default Profile

const styles = StyleSheet.create({
  search: {
    backgroundColor: "white",
    borderRadius: 10,
    width: '90%',
    height: 40,
    alignSelf: "center",
    marginVertical: 5,
    paddingLeft: 10
  },
  cardContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    width: '90%',
    alignSelf: "center"
  },
  image: {
    alignSelf: "center",
    height: '35%',
    width: '45%',
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,

    elevation: 8,
  },
  carDetails: {
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    marginTop:10
  },
  brand: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "500"
  },
  model: {
    fontSize: 16,
    fontWeight: "300"
  },
  button: {
    marginTop: 8
  },
  desc: {
    backgroundColor: "whitesmoke",
    width: '70%',
    padding: 20,
    borderRadius: 30,
    justifyContent: "center"
  },
  chipsScrollView: {
  },
  chipsIcon: {
    marginRight: 5,
  },
  chipsItem: {
    flexDirection: "column",
    alignSelf:"center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    height: '50%',
    paddingHorizontal: 20,
    marginHorizontal: 7,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.39,
    shadowRadius: 8.30,

    elevation: 13,
  },
  pp: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    marginHorizontal: 8
  },
  userCard: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "flex-start",
    width: '90%',
    height:'10%',
    backgroundColor: "whitesmoke",
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.39,
    shadowRadius: 8.30,

    elevation: 13,
  },
  userCarInfoCard: {
    backgroundColor: "white",
    width: '90%',
    alignSelf: "center",
    justifyContent: "center",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.39,
    shadowRadius: 8.30,

    elevation: 13,
  }
})