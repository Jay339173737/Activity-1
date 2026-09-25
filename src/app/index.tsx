import { View, Text } from 'react-native'
import app from 'react'

const index = () => {
  return (
    <View>
      <Text>Shoe Shop</Text>
    </View>
  )
}

export default app
const styles = {StyleSheet.create({
Container: {
    flex: 1,
    flexDirection: 'column',
},
    text:{
        color: 'black',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    }