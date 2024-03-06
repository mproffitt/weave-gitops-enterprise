import React, { FC, ReactNode, useEffect, useState } from 'react';
import { useLocation, Location } from 'react-router-dom';
import { Notification, NotificationData } from './index';

const NotificationsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[] | []>(
    [],
  );

  // Get the previous location
  const usePrevious = (value: Location<any>) => {
    const ref = React.useRef<Location<any>>();
    useEffect(() => {
      ref.current = value;
    }, [value]);
    return ref.current;
  }

  // hook to listen for location changes
  const useLocationChange = () => {
    const location = useLocation();
    const prevLocation = usePrevious(location);
    useEffect(() => {
      const prev = prevLocation?.pathname;
      const curr = location.pathname;
      // If the location changes, and the current location is not the previous
      // locations parent path, clear the notifications
      if (prev !== curr && (curr !== "/" && !prev?.startsWith(curr))) {
        setNotifications([]);
      }
    }, [location, prevLocation]);
  }

  useLocationChange();

  return (
    <Notification.Provider value={{ notifications, setNotifications }}>
      {children}
    </Notification.Provider>
  );
};

export default NotificationsProvider;
