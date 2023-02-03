import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions, ScrollView, Button, Platform, Alert, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import MapView from 'react-native-maps';
import { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebase from 'firebase/compat';
import Animated, { min } from 'react-native-reanimated';
import { Modal as PaperModal } from 'react-native-paper';
import MapViewDirections from 'react-native-maps-directions';
import Icon from 'react-native-dynamic-vector-icons';
import Draggable from 'react-native-draggable';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Timeline from "react-native-timeline-flatlist"
import DateTimePicker from '@react-native-community/datetimepicker';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Toast from '../components/Toast';

const CARD_WIDTH = Dimensions.get('window').width * 0.8;
const SPACING_FOR_CARD_INSET = Dimensions.get('window').width * 0.1 - 10;
const TIME_INTERVALS = [
  "15", "25", "30", "45", "60"
]

const Map = ({ currentUser }) => {
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [filteredMarkers, setFilteredMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState({});
  const [closestMarker, setClosestMarker] = useState({})
  const [startTime, setStartTime] = useState(new Date())
  const [visible, setVisible] = useState(false);
  const [markerId, setMarkerId] = useState("");
  const [dest, setDest] = useState("");
  const [routeDistance, setRouteDistance] = useState("");
  const [routeDuration, setRouteDuration] = useState("");
  const [selectedTimeInterval, setSelectedTimeInterval] = useState(null);
  const [distanceDurationScreenVisible, setDistanceDurationScreenVisible] = useState(false)
  const [markerIn, setMarkerIn] = useState("")
  const mapViewRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const markerRefs = useRef([]);
  const [error, setError] = useState("")
  const [timedata, setTimeData] = useState([
    { time: "00:00", lineColor: "#F8A302" }
  ])
  const [onlyTimesData, setOnlyTimesData] = useState([])
  var currentHour = new Date().getHours(); //To get the Current Hours
  var currentMin = new Date().getMinutes(); //To get the Current Minutes
  let mapIndex = 0;
  let mapAnimation = new Animated.Value(0)

  const _scrollView = React.useRef(null);
  const [mode, setMode] = useState('time');
  const [show, setShow] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);



  const onChange = (event, selectedDate) => {
    const currentDate = new Date(selectedDate)
    const hours = currentDate.getHours()
    const minutes = currentDate.getMinutes()
    let flag = true
    for (var time of onlyTimesData) {
      const [busyHour, busyMinute] = time.startTime.split(":").map(x => parseInt(x));
      const [busyEndHour, busyEndMinute] = time.endTime.split(":").map(x => parseInt(x));
      if (currentDate.getHours() >= busyHour && currentDate.getHours() <= busyEndHour) {
        if (currentDate.getMinutes() < (busyEndMinute === 0 ? 60 : busyEndMinute)) {
          setError("Seçtiğiniz zaman aralığında istasyon doludur.")
          flag = false
        }
      }
    }

    if (flag) {
      if (hours < currentHour) {
        setError("Seçtiğiniz saat güncel zamandan önce olamaz.")
      } else {
        if (hours === currentHour) {
          if (minutes < currentMin) {
            setError("Lütfen güncel saatten ilerisi bir saat seçin.")
          } else {
            setShow(false);
            setShowEndTime(true)
            setStartTime(selectedDate);
          }
        } else {
          setShow(false);
          setShowEndTime(true)
          setStartTime(selectedDate);

        }
      }
    }
  }




  const showMode = (currentMode) => {
    if (Platform.OS === 'android') {
      setShow(false);
      DateTimePickerAndroid.open({
        value: startTime,
        onChange,
        mode: currentMode,
        is24Hour: true,
      });
      // for iOS, add a button that closes the picker
    }
    setMode(currentMode);
  };



  const showTimepicker = () => {
    showMode('time');
  };


  useEffect(() => {
    const componentDidMount = async () => {
      try {
        const data = await AsyncStorage.getItem('stations');
        if (data !== null) {
          setMarkers(JSON.parse(data));
          setFilteredMarkers(JSON.parse(data))
        } else {
          const markers = [];
          await firebase.firestore().collection('zes-charging-stations').get()
            .then(querySnapshot => {
              querySnapshot.docs.forEach(doc => {
                markers.push(doc.data());
              });
            }).catch(er => console.log(er));

          await firebase.firestore().collection('e-sarj-charging-stations').get()
            .then(querySnapshot => {
              querySnapshot.docs.forEach(doc => {
                markers.push(doc.data());
              });
            }).catch(er => console.log(er));

          await AsyncStorage.setItem('stations', JSON.stringify(markers));
          setMarkers(markers)
          setFilteredMarkers(markers)
          console.log("Fetched from Firebase Firestore")
        }
      } catch (error) {
        console.error(error);
      }
    }
    componentDidMount().catch((error) => { console.log(error) });
    console.log(markers.length)
  }, [])


  function addLeadingZero(string) {
    return string.length === 1 ? `0${string}` : string;
  }

  const categories = [
    {
      name: 'Bütün İstasyonlar',
      icon: <Icon type='Ionicons' name="pin-outline" style={styles.chipsIcon} size={18} color='#358DDB' />,
    },
    {
      name: 'AC İstasyonlar',
      icon: <Icon type='Ionicons' name="flash-outline" style={styles.chipsIcon} size={18} color='#358DDB' />,
    },
    {
      name: 'DC İstasyonlar',
      icon: <Icon type='Ionicons' name="flash-outline" style={styles.chipsIcon} size={18} color='#F8A302' />,
    },
  ]

  const onMarkerPress = async (marker) => {
    setLoading(true)
    setVisible(true)

    const zesRef = firebase.firestore().collection("zes-charging-stations")
    const eSarzRef = firebase.firestore().collection("e-sarj-charging-stations")

    const query = await zesRef.where('address', '==', marker.address).get()

    if (!query.empty) {
      const snapshot = query.docs[0];
      const data = snapshot.data();
      setMarkerIn("zes-charging-stations")
      setMarkerId(snapshot.id)

      if (data.busyHours) {
        const busyIntervalCounter = data.busyHours.length
        const busyHours = [
          {
            time: `${addLeadingZero(currentHour)}:${addLeadingZero(currentMin)}`,
            title: 'Şuan',
            icon: require('../assets/flash-outline.png'),
            lineColor: "#F8A302"
          }
        ]
        const onlyHoursDataTemp = []
        const updatedBusyHours = [...snapshot.data().busyHours]
        for (let counter = 0; counter < busyIntervalCounter; counter++) {
          const [hour, minute] = snapshot.data().busyHours[counter].endTime.split(":").map(x => parseInt(x));
          console.log(hour, minute)
          if (updatedBusyHours[counter].createdAt) {
            if (updatedBusyHours[counter].createdAt.year < new Date().getUTCFullYear()) {
              updatedBusyHours.splice(counter, 1)
              await firebase.firestore().collection(markerIn).doc(markerId).update({ "busyHours": updatedBusyHours })
            } else if (updatedBusyHours[counter].createdAt.month < new Date().getUTCMonth()) {
              updatedBusyHours.splice(counter, 1)
              await firebase.firestore().collection(markerIn).doc(markerId).update({ "busyHours": updatedBusyHours })
            } else if (updatedBusyHours[counter].createdAt.day < new Date().getUTCDay()) {
              updatedBusyHours.splice(counter, 1)
              await firebase.firestore().collection(markerIn).doc(markerId).update({ "busyHours": updatedBusyHours })
            }
          } if (currentHour === hour) {
            if (currentMin > minute) {
              updatedBusyHours.splice(counter, 1)
              await firebase.firestore().collection(markerIn).doc(markerId).update({ "busyHours": updatedBusyHours })
            }
          } else if (currentHour > hour) {
            updatedBusyHours.splice(counter, 1)
            await firebase.firestore().collection(markerIn).doc(markerId).update({ "busyHours": updatedBusyHours })
          }
        }
        if (updatedBusyHours.length > 0) {
          for (let counter = 0; counter < busyIntervalCounter; counter++) {
            onlyHoursDataTemp.push({
              startTime: updatedBusyHours[counter].startTime,
              endTime: updatedBusyHours[counter].endTime,
              createdAt:
              {
                year: new Date().getUTCFullYear(),
                month: new Date().getUTCMonth(),
                day: new Date().getUTCDay()
              }
            })
            const [hour, minute] = updatedBusyHours[counter].startTime.split(":").map(x => parseInt(x));
            const [endHour, endMinute] = updatedBusyHours[counter].startTime.split(":").map(x => parseInt(x));
            console.log(hour, minute)
            if (currentHour > hour || currentHour === hour) {
              if (currentMin > minute) {
                console.log("first")
                busyHours.pop()
                busyHours.push({
                  time: addLeadingZero(updatedBusyHours[counter].startTime),
                  title: 'Dolu',
                  description: '',
                  lineColor: '#ff3b3b',
                  icon: require('../assets/flash-outline.png')
                })
                busyHours.push({
                  time: `${addLeadingZero(currentHour)}:${addLeadingZero(currentMin)}`,
                  title: 'Şuan',
                  icon: require('../assets/flash-outline.png'),
                  lineColor: "#ff3b3b"
                })
                busyHours.push({
                  time: addLeadingZero(updatedBusyHours[counter].endTime),
                  description: '',
                  lineColor: '#F8A302',
                  icon: require('../assets/flash-outline.png')
                })
              } else if (currentMin < endMinute) {
                busyHours.pop()
                busyHours.push({
                  time: addLeadingZero(updatedBusyHours[counter].startTime),
                  title: 'Dolu',
                  description: '',
                  lineColor: '#ff3b3b',
                  icon: require('../assets/flash-outline.png')
                })
                busyHours.push({
                  time: `${addLeadingZero(currentHour)}:${addLeadingZero(currentMin)}`,
                  title: 'Şuan',
                  icon: require('../assets/flash-outline.png'),
                  lineColor: "#ff3b3b"
                })
                busyHours.push({
                  time: addLeadingZero(updatedBusyHours[counter].endTime),
                  description: '',
                  lineColor: '#F8A302',
                  icon: require('../assets/flash-outline.png')
                })
              }
            } else if (currentHour > endHour || currentHour === endHour) {
              if (currentHour === endHour && currentMin > endMinute) {
                busyHours.pop()
                busyHours.push({
                  time: addLeadingZero(updatedBusyHours[counter].startTime),
                  title: 'Dolu',
                  description: '',
                  lineColor: '#ff3b3b',
                  icon: require('../assets/flash-outline.png')
                })
                busyHours.push({
                  time: addLeadingZero(updatedBusyHours[counter].endTime),
                  description: '',
                  lineColor: '#F8A302',
                  icon: require('../assets/flash-outline.png')
                })
                busyHours.push({
                  time: `${addLeadingZero(currentHour)}:${addLeadingZero(currentMin)}`,
                  title: 'Şuan',
                  icon: require('../assets/flash-outline.png'),
                  lineColor: "#ff3b3b"
                })
              } else if (currentHour > endHour && currentMin > endMinute) {
                busyHours.pop()
                busyHours.push({
                  time: addLeadingZero(updatedBusyHours[counter].startTime),
                  title: 'Dolu',
                  description: '',
                  lineColor: '#ff3b3b',
                  icon: require('../assets/flash-outline.png')
                })
                busyHours.push({
                  time: addLeadingZero(updatedBusyHours[counter].endTime),
                  description: '',
                  lineColor: '#F8A302',
                  icon: require('../assets/flash-outline.png')
                })
                busyHours.push({
                  time: `${addLeadingZero(currentHour)}:${addLeadingZero(currentMin)}`,
                  title: 'Şuan',
                  icon: require('../assets/flash-outline.png'),
                  lineColor: "#ff3b3b"
                })
              }
            }
            else {
              busyHours.push({
                time: addLeadingZero(updatedBusyHours[counter].startTime),
                title: 'Dolu',
                description: '',
                lineColor: '#ff3b3b',
                icon: require('../assets/flash-outline.png')
              })
              busyHours.push({
                time: addLeadingZero(updatedBusyHours[counter].endTime),
                description: '',
                lineColor: '#F8A302',
                icon: require('../assets/flash-outline.png')
              })
            }

          }
          busyHours.push({ time: "00:00", lineColor: "#F8A302", icon: require('../assets/flash-outline.png') })
          setTimeData(busyHours)
          setOnlyTimesData(onlyHoursDataTemp)
        } else {
          const busyHours = []
          busyHours.push({
            time: `${addLeadingZero(currentHour)}:${addLeadingZero(currentMin)}`,
            title: 'Şuan',
            icon: require('../assets/flash-outline.png'),
            lineColor: "#F8A302"
          },
            { time: "00:00", lineColor: "#F8A302", icon: require('../assets/flash-outline.png') }
          )
          setTimeData(busyHours)
          setOnlyTimesData([])
        }
      } else {
        const busyHours = []
        busyHours.push({
          time: `${addLeadingZero(currentHour)}:${addLeadingZero(currentMin)}`,
          title: 'Şuan',
          icon: require('../assets/flash-outline.png'),
          lineColor: "#F8A302"
        },
          { time: "00:00", lineColor: "#F8A302", icon: require('../assets/flash-outline.png') }
        )
        setTimeData(busyHours)
        setOnlyTimesData([])
      }

    } else {
      setMarkerIn("e-sarj-charging-stations")
      const query = await eSarzRef.where('address', '==', marker.address).get();
      if (!query.empty) {
        const snapshot = query.docs[0];
        setMarkerId(snapshot.id)
        const data = snapshot.data();

        if (data.busyHours) {
          const busyIntervalCounter = data.busyHours.length
          const busyHours = [
            {
              time: `${addLeadingZero(currentHour)}:${addLeadingZero(currentMin)}`,
              title: 'Şuan',
              icon: require('../assets/flash-outline.png'),
              lineColor: "#F8A302"
            }
          ]
          const onlyHoursDataTemp = []
          const updatedBusyHours = [...snapshot.data().busyHours]
          for (let counter = 0; counter < busyIntervalCounter; counter++) {
            const [hour, minute] = snapshot.data().busyHours[counter].endTime.split(":").map(x => parseInt(x));
            console.log(hour, minute)
            if (updatedBusyHours[counter].createdAt) {
              if (updatedBusyHours[counter].createdAt.year < new Date().getUTCFullYear()) {
                updatedBusyHours.splice(counter, 1)
                await firebase.firestore().collection(markerIn).doc(markerId).update({ "busyHours": updatedBusyHours })
              } else if (updatedBusyHours[counter].createdAt.month < new Date().getUTCMonth()) {
                updatedBusyHours.splice(counter, 1)
                await firebase.firestore().collection(markerIn).doc(markerId).update({ "busyHours": updatedBusyHours })
              } else if (updatedBusyHours[counter].createdAt.day < new Date().getUTCDay()) {
                updatedBusyHours.splice(counter, 1)
                await firebase.firestore().collection(markerIn).doc(markerId).update({ "busyHours": updatedBusyHours })
              }
            } if (currentHour === hour) {
              if (currentMin > minute) {
                updatedBusyHours.splice(counter, 1)
                await firebase.firestore().collection(markerIn).doc(markerId).update({ "busyHours": updatedBusyHours })
              }
            } else if (currentHour > hour) {
              updatedBusyHours.splice(counter, 1)
              await firebase.firestore().collection(markerIn).doc(markerId).update({ "busyHours": updatedBusyHours })
            }
          }
          if (updatedBusyHours.length > 0) {
            for (let counter = 0; counter < busyIntervalCounter; counter++) {
              onlyHoursDataTemp.push({
                startTime: updatedBusyHours[counter].startTime,
                endTime: updatedBusyHours[counter].endTime,
                createdAt:
                {
                  year: new Date().getUTCFullYear(),
                  month: new Date().getUTCMonth(),
                  day: new Date().getUTCDay()
                }
              })
              const [hour, minute] = updatedBusyHours[counter].startTime.split(":").map(x => parseInt(x));
              const [endHour, endMinute] = updatedBusyHours[counter].startTime.split(":").map(x => parseInt(x));
              console.log(hour, minute)
              if (currentHour > hour || currentHour === hour) {
                if (currentMin > minute) {
                  console.log("first")
                  busyHours.pop()
                  busyHours.push({
                    time: addLeadingZero(updatedBusyHours[counter].startTime),
                    title: 'Dolu',
                    description: '',
                    lineColor: '#ff3b3b',
                    icon: require('../assets/flash-outline.png')
                  })
                  busyHours.push({
                    time: `${addLeadingZero(currentHour)}:${addLeadingZero(currentMin)}`,
                    title: 'Şuan',
                    icon: require('../assets/flash-outline.png'),
                    lineColor: "#ff3b3b"
                  })
                  busyHours.push({
                    time: addLeadingZero(updatedBusyHours[counter].endTime),
                    description: '',
                    lineColor: '#F8A302',
                    icon: require('../assets/flash-outline.png')
                  })
                } else if (currentMin < endMinute) {
                  busyHours.pop()
                  busyHours.push({
                    time: addLeadingZero(updatedBusyHours[counter].startTime),
                    title: 'Dolu',
                    description: '',
                    lineColor: '#ff3b3b',
                    icon: require('../assets/flash-outline.png')
                  })
                  busyHours.push({
                    time: `${addLeadingZero(currentHour)}:${addLeadingZero(currentMin)}`,
                    title: 'Şuan',
                    icon: require('../assets/flash-outline.png'),
                    lineColor: "#ff3b3b"
                  })
                  busyHours.push({
                    time: addLeadingZero(updatedBusyHours[counter].endTime),
                    description: '',
                    lineColor: '#F8A302',
                    icon: require('../assets/flash-outline.png')
                  })
                }
              } else if (currentHour > endHour || currentHour === endHour) {
                if (currentHour === endHour && currentMin > endMinute) {
                  busyHours.pop()
                  busyHours.push({
                    time: addLeadingZero(updatedBusyHours[counter].startTime),
                    title: 'Dolu',
                    description: '',
                    lineColor: '#ff3b3b',
                    icon: require('../assets/flash-outline.png')
                  })
                  busyHours.push({
                    time: addLeadingZero(updatedBusyHours[counter].endTime),
                    description: '',
                    lineColor: '#F8A302',
                    icon: require('../assets/flash-outline.png')
                  })
                  busyHours.push({
                    time: `${addLeadingZero(currentHour)}:${addLeadingZero(currentMin)}`,
                    title: 'Şuan',
                    icon: require('../assets/flash-outline.png'),
                    lineColor: "#ff3b3b"
                  })
                } else if (currentHour > endHour && currentMin > endMinute) {
                  busyHours.pop()
                  busyHours.push({
                    time: addLeadingZero(updatedBusyHours[counter].startTime),
                    title: 'Dolu',
                    description: '',
                    lineColor: '#ff3b3b',
                    icon: require('../assets/flash-outline.png')
                  })
                  busyHours.push({
                    time: addLeadingZero(updatedBusyHours[counter].endTime),
                    description: '',
                    lineColor: '#F8A302',
                    icon: require('../assets/flash-outline.png')
                  })
                  busyHours.push({
                    time: `${addLeadingZero(currentHour)}:${addLeadingZero(currentMin)}`,
                    title: 'Şuan',
                    icon: require('../assets/flash-outline.png'),
                    lineColor: "#ff3b3b"
                  })
                }
              }
              else {
                busyHours.push({
                  time: addLeadingZero(updatedBusyHours[counter].startTime),
                  title: 'Dolu',
                  description: '',
                  lineColor: '#ff3b3b',
                  icon: require('../assets/flash-outline.png')
                })
                busyHours.push({
                  time: addLeadingZero(updatedBusyHours[counter].endTime),
                  description: '',
                  lineColor: '#F8A302',
                  icon: require('../assets/flash-outline.png')
                })
              }

            }
            busyHours.push({ time: "00:00", lineColor: "#F8A302", icon: require('../assets/flash-outline.png') })
            setTimeData(busyHours)
            setOnlyTimesData(onlyHoursDataTemp)
          } else {
            const busyHours = []
            busyHours.push({
              time: `${addLeadingZero(currentHour)}:${addLeadingZero(currentMin)}`,
              title: 'Şuan',
              icon: require('../assets/flash-outline.png'),
              lineColor: "#F8A302"
            },
              { time: "00:00", lineColor: "#F8A302", icon: require('../assets/flash-outline.png') }
            )
            setTimeData(busyHours)
            setOnlyTimesData([])
          }
        } else {
          const busyHours = []
          busyHours.push({
            time: `${addLeadingZero(currentHour)}:${addLeadingZero(currentMin)}`,
            title: 'Şuan',
            icon: require('../assets/flash-outline.png'),
            lineColor: "#F8A302"
          },
            { time: "00:00", lineColor: "#F8A302", icon: require('../assets/flash-outline.png') }
          )
          setTimeData(busyHours)
          setOnlyTimesData([])
        }


      }
    }


    console.log(markerId)
    setSelectedMarker(marker)
    setLoading(false)

  }


  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      const subscription = Location.watchPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 10,
      }, location => 
      setRegion(location.coords));

      return () => subscription.remove();
    })();
  }, []);




  const drawRoute = (dest) => {
    const destination = { latitude: dest.latitude, longitude: dest.longitude }
    setDest(destination)
    setDistanceDurationScreenVisible(true)
    setVisible(false)
  }

  const dragHandler = (e) => {
    e.nativeEvent.pageY < 15 && setDistanceDurationScreenVisible(false)
    e.nativeEvent.pageY < 15 && setSelectedMarker({})
  }

  const filterPressHandler = (index) => {
    let filteredMarkers = []
    if (index === 0) {
      filteredMarkers = markers
    }
    if (index === 1) {
      markers.forEach(marker => {
        if (marker.chargeType.includes("AC")) {
          filteredMarkers.push(marker)
        }
      }
      )
    } else if (index === 2) {
      markers.forEach(marker => {
        if (marker.chargeType.includes("DC")) {
          filteredMarkers.push(marker)
        }
      }
      )
    }
    setFilteredMarkers(filteredMarkers)
  }



  const findClosestMarker = () => {
    // calculate the distance between user's location and each marker
    const sortedMarkers = filteredMarkers.sort((a, b) => {
      const aDistance = calculateDistance(
        region.latitude,
        region.longitude,
        a.latitude,
        a.longitude,
      );
      const bDistance = calculateDistance(
        region.latitude,
        region.longitude,
        b.latitude,
        b.longitude,
      );
      return aDistance - bDistance;
    });

    // access the first item in the sorted array, which is the closest marker
    const closestMarker = sortedMarkers[0];
    console.log(closestMarker);
    setClosestMarker(closestMarker)
    let closestMarkerRegion = {
      latitude: Number(closestMarker.latitude),
      longitude: Number(closestMarker.longitude),
      latitudeDelta: 0.0522,
      longitudeDelta: 0.0321,
    };


    mapViewRef.current.animateToRegion(closestMarkerRegion, 2000)

  };

  // helper function to calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const reservationHandler = async () => {
    let busyHoursData = [...onlyTimesData]
    const timeInterval = Number(TIME_INTERVALS[selectedTimeInterval])
    let endHour = 0
    let endMinute = 0
    let endTime = startTime.getMinutes() + timeInterval

    if (endTime >= 60) {
      endHour = startTime.getHours() + 1
      endMinute = endTime - 60
    } else {
      endHour = startTime.getHours()
      endMinute = endTime
    }
    if (busyHoursData.length === 0) {


      busyHoursData.push({
        startTime: `${startTime.getHours()}:${startTime.getMinutes()}`, endTime: `${endHour}:${endMinute}`, createdAt:
        {
          year: new Date().getUTCFullYear(),
          month: new Date().getUTCMonth(),
          day: new Date().getUTCDay()
        }
      })
    } else if (busyHoursData.length === 1) {
      const [busyHour, busyMinute] = busyHoursData[0].startTime.split(":").map(x => parseInt(x));
      if (busyHour > startTime.getHours()) {
        const busyHoursHandler = busyHoursData.pop()
        busyHoursData.push({
          startTime: `${startTime.getHours()}:${startTime.getMinutes()}`, endTime: `${endHour}:${endMinute}`, createdAt:
          {
            year: new Date().getUTCFullYear(),
            month: new Date().getUTCMonth(),
            day: new Date().getUTCDay()
          }
        })
        busyHoursData.push(busyHoursHandler)
      } else if (busyHour < startTime.getHours()) {
        busyHoursData.push({
          startTime: `${startTime.getHours()}:${startTime.getMinutes()}`, endTime: `${endHour}:${endMinute}`, createdAt:
          {
            year: new Date().getUTCFullYear(),
            month: new Date().getUTCMonth(),
            day: new Date().getUTCDay()
          }
        })
      }
    } else if (busyHoursData.length > 1) {
      let flag = 0
      for (let counter = 0; counter < busyHoursData.length; counter++) {
        const [busyHour, busyMinute] = busyHoursData[counter].startTime.split(":").map(x => parseInt(x));
        if (busyHour === startTime.getHours()) {
          if (startTime.getHours() > busyHour) {
            flag = counter
          }
        } else if (busyHour < startTime.getHours()) {
          flag = counter
        }
      }
      busyHoursData.splice(flag + 1, 0, {
        startTime: `${startTime.getHours()}:${startTime.getMinutes()}`, endTime: `${endHour}:${endMinute}`, createdAt:
        {
          year: new Date().getUTCFullYear(),
          month: new Date().getUTCMonth(),
          day: new Date().getUTCDay()
        }
      })
    }
    await firebase.firestore().collection(markerIn).doc(markerId).update({ "busyHours": busyHoursData }).catch(err => console.log(err))
    console.log(markerId)
    setShowEndTime(false)
    drawRoute(selectedMarker)

  }

  const userInLocation = () => {
    Alert.alert(
      "Ulaşım Tamamlandı",
      "İstasyon alanına ulaştınız mı?",
      [
        {
          text: "İptal",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel"
        },
        {
          text: "Onayla", onPress: () => {
            setDistanceDurationScreenVisible(false)
            setSelectedMarker({})
          }
        }
      ]
    );

  }

  const goToUserLocation = () => {
    
    let animateTo = {
      latitude: Number(region.latitude),
      longitude: Number(region.longitude),
      latitudeDelta: 0.0522,
      longitudeDelta: 0.0321,
    };

    mapViewRef.current.animateToRegion(animateTo, 2000)
  }

  return (
    <View style={styles.container}>
      {loading && (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F8A302" />
      </View>
    )}
      <MapView
        initialRegion={region}
        style={styles.map}
        ref={mapViewRef}
        loadingEnabled={true}
        loadingIndicatorColor="#F8A302"
        loadingBackgroundColor="#fff"
        moveOnMarkerPress={true}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsPointsOfInterest={false}
        followsUserLocation={true}
      >
        {
          filteredMarkers.map((marker, index) => (
            (marker.latitude && marker.longitude && marker) &&
            <Marker
              key={index}
              coordinate={{ latitude: parseFloat(marker.latitude), longitude: parseFloat(marker.longitude) }}
              image={marker.chargeType.includes("AC") ? require("../assets/ac.png") : require("../assets/dc.png")}
              onPress={() => onMarkerPress(marker)}
              ref={markerRefs}
            />


            //AIzaSyB7s8_cdvzu_2TQbeJCr0adtXquQ_jDrkA
          ))
        }

        {(region && selectedMarker != {}) &&
          <MapViewDirections
            origin={distanceDurationScreenVisible && { latitude: region.latitude, longitude: region.longitude }}
            destination={distanceDurationScreenVisible && { latitude: dest.latitude, longitude: dest.longitude }}
            apikey={"AIzaSyB7s8_cdvzu_2TQbeJCr0adtXquQ_jDrkA"}
            strokeWidth={3}
            timePrecision="now"
            followsUserLocation={true}

            onUserLocationChange={(e) => { console.log(e.nativeEvent) }}
            optimizeWaypoints={true}
            onReady={result => {
              setRouteDuration(result.duration)
              setRouteDistance(result.distance)
            }}
            strokeColor="#F8A302"
          />
        }
      </MapView>

      <View
        style={{ position: "absolute", marginTop: 65, width: "100%", alignItems: "center", justifyContent: "flex-start" }}
      >
        <GooglePlacesAutocomplete
          placeholder='Konum Ara'
          minLength={2}
          autoFocus={false}
          returnKeyType={'default'}
          fetchDetails={true}
          onPress={(data, details = null) => {
            let region = {
              latitude: details.geometry.location.lat,
              longitude: details.geometry.location.lng,
              latitudeDelta: 0.0522,
              longitudeDelta: 0.0321,
            };
            mapViewRef.current.animateToRegion(region, 2000)
          }}
          query={{
            key: "AIzaSyB7s8_cdvzu_2TQbeJCr0adtXquQ_jDrkA",
            language: 'tr', // language of the results
          }}
          styles={{
            textInputContainer: {
              alignItems: "center",
              justifyContent: "flex-start",
              width: "90%",
              maxWidth: "90%"
            },
            listView: {
              maxWidth: "90%",

            },
            textInput: {
              height: 38,
              color: '#5d5d5d',
              fontSize: 16,
            },
            predefinedPlacesDescription: {
              color: '#1faadb',
            },
          }}
        />
      </View>
      <ScrollView
        horizontal
        scrollEventThrottle={1}
        showsHorizontalScrollIndicator={false}
        height={50}
        style={styles.chipsScrollView}
        contentInset={{ // iOS only
          top: 0,
          left: 0,
          bottom: 0,
          right: 20
        }}
        contentContainerStyle={{
          paddingRight: Platform.OS === 'android' ? 20 : 0
        }}
      >
        {categories.map((category, index) => (
          <TouchableOpacity key={index} style={styles.chipsItem} onPress={() => filterPressHandler(index)}>
            {category.icon}
            <Text>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={{ position: "absolute", width: "100%", height: "100%", alignItems: "flex-end", justifyContent: "flex-end", paddingBottom: 100, paddingRight: 20 }}>
        <TouchableOpacity onPress={() => { goToUserLocation() }}>
          <View style={{ backgroundColor: "white", borderRadius: 20, padding: 5 }}>
            <Icon type='Ionicons' name='locate-outline' size={32} color="#358DDB" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={{ position: "absolute", width: "100%", height: "100%", alignItems: "center", justifyContent: "flex-start", paddingTop: 160 }}>
        <TouchableOpacity style={styles.chipsItem} onPress={() => {
          findClosestMarker();
        }}>
          <Text>En yakın şarj istasyonunu göster</Text>
        </TouchableOpacity>
      </View>

      <PaperModal
        visible={visible}
        onDismiss={() => { setVisible(false) }}
        style={styles.bottomModal}
      >
        <View style={styles.card}>

          <View style={styles.textContent}>
            <View style={styles.cardType}>
              <Image
                source={selectedMarker?.chargeType?.includes("AC") ? require("../assets/ACPNG.png") : require("../assets/DCPNG.png")}
                style={styles.cardImage}
                resizeMode="contain" />
              <View style={{ flexDirection: "column", justifyContent: "center" }}>
                <Text numberOfLines={1} style={styles.cardtitle}>{selectedMarker?.chargeType}</Text>
                <Text numberOfLines={3} style={[styles.cardDescription, { maxWidth: 200 }]}>{selectedMarker?.usingHours}</Text>
              </View>
            </View>
            <View style={styles.descriptionContainer}>
              <Text style={styles.cardDescription}>{selectedMarker?.address}</Text>
            </View>
            <Timeline
              style={{ marginTop: 6 }}
              data={timedata}
              innerCircle={'icon'}
              circleStyle={{ backgroundColor: "white", paddingVertical: 15 }}
              circleSize={20}
            />
            <View style={styles.button}>
              <Button onPress={showTimepicker} title="Zaman Aralığı Seç" />
              {show && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={startTime}
                  mode={mode}
                  is24Hour={true}
                  onChange={onChange}
                />
              )}



              {/* <TouchableOpacity
                onPress={() => { drawRoute(selectedMarker) }}
                style={[styles.signIn, {
                  borderColor: selectedMarker.chargeType?.includes("AC") ? "#358DDB" : '#F8A302',
                  borderWidth: 1
                }]}
              >
                <Text style={[styles.textSign, {
                  color: selectedMarker.chargeType?.includes("AC") ? "#358DDB" : '#F8A302'
                }]}>Rota Oluştur</Text>
              </TouchableOpacity> */}
            </View>
          </View>

        </View>
      </PaperModal>
      {distanceDurationScreenVisible &&
        <Draggable x={190} renderSize={56} renderColor='black' renderText='A' shouldReverse onDrag={(e) => { dragHandler(e) }}>
          <View
            style={styles.goToDestModal}
          >
            <View style={styles.cardType}>
              <Image
                source={selectedMarker?.chargeType?.includes("AC") ? require("../assets/ACPNG.png") : require("../assets/DCPNG.png")}
                style={styles.cardImage}
                resizeMode="contain" />
              <View style={{ flexDirection: "column", justifyContent: "center" }}>
                <Text numberOfLines={1} style={styles.cardtitle}>{selectedMarker?.chargeType}</Text>
                <Text numberOfLines={3} style={[styles.cardDescription, { maxWidth: 200 }]}>Uzaklık: {Math.trunc(routeDistance)}{routeDistance.toString().slice(routeDistance.toString().indexOf("."), routeDistance.toString().indexOf(".") + 2)} Kilometre</Text>
                <Text numberOfLines={3} style={[styles.cardDescription, { maxWidth: 200 }]}>Tahmini varış: {Math.trunc(routeDuration)} Dakika {Number(routeDuration.toString().slice(routeDuration.toString().indexOf("."), routeDuration.toString().indexOf(".") + 2)) * 60} Saniye</Text>
              </View>
              <View style={styles.buttonContainer}>
                <View style={styles.acceptButton}>
                  <TouchableOpacity onPress={() => { userInLocation() }}>
                    <Icon type='Ionicons' name='checkmark-outline' color='#358DDB' />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Draggable>
      }
      <PaperModal
        visible={showEndTime}
        onDismiss={() => { setShowEndTime(false) }}
        style={styles.bottomModal}>
        <View style={styles.card}>
          <Text style={{ textAlign: "center", marginTop: 20, fontSize: 20 }}>
            Rezerve süresi:
          </Text>
          <ScrollView
            horizontal
            scrollEventThrottle={1}
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScrollViewTimePicker}

            contentInset={{ // iOS only
              top: 0,
              left: 0,
              bottom: 0,
              right: 20
            }}
            contentContainerStyle={{
              paddingRight: Platform.OS === 'android' ? 20 : 0
            }}>
            {
              TIME_INTERVALS.map((time, index) => {
                return (
                  <TouchableOpacity key={index} style={index === selectedTimeInterval ? styles.chipsItemTimesSelected : styles.chipsItemTimes} onPress={() => setSelectedTimeInterval(index)}>
                    <Text>{time} Dakika</Text>
                  </TouchableOpacity>)
              })
            }
          </ScrollView>
          <Button title='Onayla' onPress={() => { reservationHandler() }} />
        </View>

      </PaperModal>
      <Toast message={error} onDismiss={() => setError('')} />

    </View>
  )
}

export default Map

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height + 50,
  },
  searchBox: {
    position: 'absolute',
    marginTop: Platform.OS === 'ios' ? 60 : 60,
    flexDirection: "row",
    backgroundColor: '#fff',
    width: '90%',
    alignSelf: 'center',
    borderRadius: 5,
    padding: 10,
    shadowColor: '#ccc',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
  },
  scrollView: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
  },
  endPadding: {
    paddingRight: Dimensions.get('window').width - CARD_WIDTH,
  },
  card: {
    // padding: 10,
    flexDirection: "column",
    elevation: 2,
    backgroundColor: "#FFF",
    borderRadius: 10,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowRadius: 5,
    shadowOpacity: 0.3,
    shadowOffset: { x: 2, y: -2 },
    height: "70%",
    width: CARD_WIDTH,
    overflow: "hidden",
    marginBottom: 100,
  },
  cardType: {
    backgroundColor: "#ececec",
    flexDirection: "row",
    borderRadius: 20,
    marginBottom: 5
  },
  cardImage: {
    width: 80,
    height: 80,
    alignSelf: "center",
  },
  textContent: {
    flex: 2,
    padding: 10,
  },
  cardtitle: {
    fontSize: 18,
    // marginBottom: 5,
    textAlignVertical: "center",
    fontWeight: "bold",
  },

  cardDescription: {
    fontSize: 12,
    color: "#444",
  },
  markerWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
  },
  marker: {
    width: 30,
    height: 30,
  },
  button: {
    alignItems: 'center',
    marginTop: 20,

  },
  signIn: {
    width: '100%',
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3
  },
  textSign: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
    alignItems: "center"
  },
  goToDestModal: {
    position: "absolute",
    marginTop: 110,
    width: "90%",
    alignSelf: "center",
    zIndex: 999
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end"
  },
  acceptButton: {
    alignSelf: "center",
    borderColor: "#358DDB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 15,
    marginRight: 10,
    width: 50,
    height: 50,
  },
  chipsScrollView: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 110,
    paddingHorizontal: 10
  },
  chipsScrollViewTimePicker: {
  },
  chipsIcon: {
    marginRight: 5,
  },
  chipsItem: {
    flexDirection: "row",
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    paddingHorizontal: 20,
    marginHorizontal: 7,
    height: 35,
    shadowColor: '#ccc',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
  },
  chipsItemTimes: {
    flexDirection: "column",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    height: '20%',
    paddingHorizontal: 20,
    marginHorizontal: 7,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.39,
    shadowRadius: 8.30,
    transition: "0.4s ease-in-out",

    elevation: 13,
  },
  chipsItemTimesSelected: {
    flexDirection: "column",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    height: '20%',
    borderColor: "#F8A302",
    borderWidth: 0.5,
    shadowColor: "#F8A302",
    paddingHorizontal: 30,
    marginHorizontal: 7,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.39,
    shadowRadius: 8.30,
    transition: "0.4s ease-in-out",
    elevation: 13,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    zIndex:9999
  },
})