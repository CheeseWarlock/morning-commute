import React from "react";

interface TrainDetailProps {
  trainId: string;
  currentPassengers: number;
  maxPassengers: number;
  destinations: {
    stationName: string;
    passengerCount: number;
  }[];
}

export const TrainDetail: React.FC<TrainDetailProps> = ({
  trainId,
  currentPassengers,
  maxPassengers,
  destinations,
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 w-64 flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold mb-2">Train {trainId}</h2>

        <div className="mb-4">
          <p className="text-gray-700">
            Passengers: {currentPassengers}/{maxPassengers}
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Destinations:</h3>
          <div className="space-y-1">
            {destinations.map((dest, index) => (
              <div key={index} className="flex justify-between text-gray-600">
                <span>{dest.stationName}:</span>
                <span>{dest.passengerCount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <div className="p-4">
          <span className="font-bold">W</span> and{" "}
          <span className="font-bold">S</span> to change selected train
        </div>
        <div className="p-4">
          <span className="font-bold">A</span> and{" "}
          <span className="font-bold">D</span> to change turn direction
        </div>
        <div className="p-4">
          <span className="font-bold">Mouse</span> to change view
        </div>
      </div>
    </div>
  );
};

// Example usage:
/*
<TrainDetail
  trainId="A"
  currentPassengers={5}
  maxPassengers={6}
  destinations={[
    { stationName: "Station A", passengerCount: 3 },
    { stationName: "Station B", passengerCount: 2 }
  ]}
/>
*/
