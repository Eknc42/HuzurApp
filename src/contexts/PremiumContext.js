import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeRevenueCat, checkPremiumStatus } from '../services/revenueCatService';
import Purchases from 'react-native-purchases';

const PremiumContext = createContext({
  isPremium: false,
  checkPremium: async () => {},
});

export const PremiumProvider = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    // Initialize RevenueCat when context mounts
    initializeRevenueCat().then(() => {
      checkPremium();
    });

    // Listen to customer info changes
    Purchases.addCustomerInfoUpdateListener((info) => {
      // const hasPremium = info.entitlements.active['Premium'] !== undefined;
      // setIsPremium(hasPremium);
      setIsPremium(false); // GECICI OLARAK PREMIUM KAPALI (TEST ICIN PAYWALL GORUNSUN)
    });

  }, []);

  const checkPremium = async () => {
    // const status = await checkPremiumStatus();
    // setIsPremium(status);
    setIsPremium(false); // GECICI OLARAK PREMIUM KAPALI (TEST ICIN PAYWALL GORUNSUN)
  };

  return (
    <PremiumContext.Provider value={{ isPremium, checkPremium }}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => useContext(PremiumContext);
