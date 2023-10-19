<?php

$curl = curl_init();


curl_setopt_array($curl, array(
  CURLOPT_URL => 'localhost:8800/api/v1/auth/verifyaccount/'.$_GET['token'],
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'POST',
  CURLOPT_HTTPHEADER => array(
    'api-key: zAjncTToCOMyDXp8sfav/oGWHvgnLgJPjZCYbwOg/fDdOO2Rk6uG8QlFfsB9BuPt'
  ),
));


$response = curl_exec($curl);

curl_close($curl);
 
 if(strlen($response) > 70) {
  echo "<script>alert('Your Account has been Verified Success!')</script>";
 } else {
  echo "<script>alert('Please Check Your Mail, Failed to Verified')</script>";
 }



?>