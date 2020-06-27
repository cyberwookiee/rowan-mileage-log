import React from 'react';
import { Flex, Box } from 'reflexbox';
import PropTypes from 'prop-types';

class MileageLog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { printing, tolls, trips, config } = this.props;

    const rate = parseFloat(config.mileageRate);
    let tollsTotal = 0;
    let mileageTotal = 0;
    const distanceToRowan = parseFloat(config.distanceToRowan);

    const relevantTrips = trips.sort((tripA, tripB) => {
      const tripADate = new Date(`${tripA.Date} ${tripA['Time Started']}`);
      const tripBDate = new Date(`${tripB.Date} ${tripB['Time Started']}`);

      if (tripADate < tripBDate) {
        return -1;
      }

      if (tripADate > tripBDate) {
        return 1;
      }

      return 0;
    });

    let previousTrip = null;

    const outputLog = relevantTrips.reduce((agg, trip, i) => {
      const firstOfDay =
        previousTrip == null || previousTrip.Date !== trip.Date;
      const lastOfDay =
        relevantTrips.length === i + 1 ||
        relevantTrips[i + 1].Date !== trip.Date;

      const started = new Date(`${trip.Date} ${trip['Time Started']}`);
      const ended = new Date(`${trip.Date} ${trip['Time Ended']}`);

      const row = {};

      row.Date = trip.Date;
      row['Start Location'] = trip.From;
      row.Destination = trip.To;

      let miles = parseFloat(trip.Miles);

      if (!Number.isNaN(miles) && row.Destination !== '' && row.Date !== '') {
        let deductionApplied = false;

        if (firstOfDay && trip.From.includes(config.homeAddressStreetName)) {
          deductionApplied = true;
          miles -= distanceToRowan;
        } else if (
          lastOfDay &&
          trip.To.includes(config.homeAddressStreetName)
        ) {
          deductionApplied = true;
          miles -= distanceToRowan;
        }

        row.Mileage = miles.toFixed(1);
        row.Tolls = 0;

        const relevantTolls = tolls.filter(toll => {
          const when = new Date(
            `${toll['TRANSACTION DATE']} ${toll['EXIT TIME']}`
          );
          return toll.DESCRIPTION === 'TOLL' && when > started && when < ended;
        });

        row.Tolls = relevantTolls.reduce(
          (tot, toll) =>
            tot + parseFloat(toll.AMOUNT.substr(2, toll.AMOUNT.length - 3)),
          0
        );

        tollsTotal += row.Tolls;
        mileageTotal += miles;

        row.Start = trip['Time Started'];
        row.End = trip['Time Ended'];
        row.Reimbursement = (row.Mileage * rate + row.Tolls).toFixed(1);

        //	row.Route = trip['Map Image URL'];

        const negativeDisclaimer =
          miles < 0
            ? 'Negative values included to offset other mileage reimbursement for same day.'
            : '';
        const deductionStr = deductionApplied
          ? `. Mileage shown includes deduction of ${distanceToRowan.toFixed(
              1
            )} miles for daily commute.  Original Miles:  ${
              trip.Miles
            }. ${negativeDisclaimer}`
          : '';
        row['Description/Notes'] = `Trip Type: ${trip.Purpose}. Trip Purpose: ${
          trip['Business Line']
        }${deductionStr}`;

        agg.push(row);

        previousTrip = trip;
      }
      return agg;
    }, []);

    const nbsp = '\u00A0';

    return (
      <div className={printing ? 'mileage-log-black' : 'mileage-log'}>
        <h1 className="mileage-log-title">Rowan University Mileage Log</h1>
        <div className="mileage-log-body">
          <div className="mileage-log-header">
            <Flex p={2} align="left">
              <Box className="text-left" w={2 / 5}>
                <Flex py={1} align="left">
                  <Box className="bold" w={1 / 3}>
                    {nbsp}
                  </Box>
                  <Box className="text-center" w={2 / 3}>
                    (Print)
                  </Box>
                </Flex>
                <Flex align="left">
                  <Box className="bold" w={1 / 3}>
                    Employee:
                  </Box>
                  <Box className="underline" w={2 / 3}>
                    {config.employeeName}
                  </Box>
                </Flex>
                <Flex align="left">
                  <Box className="bold" w={1 / 3}>
                    Address:
                  </Box>
                  <Box className="underline" w={2 / 3}>{`${
                    config.homeAddressStreetNumber
                  } ${config.homeAddressStreetName} ${
                    config.homeAddressAdditional
                  }`}</Box>
                </Flex>
                <Flex align="left">
                  <Box className="bold" w={1 / 3} />
                  <Box className="underline" w={2 / 3}>{`${
                    config.homeAddressCity
                  }, ${config.homeAddressState}  ${
                    config.homeAddressZip
                  }`}</Box>
                </Flex>
                <Flex align="left">
                  <Box className="bold" w={1 / 6}>
                    ID:
                  </Box>
                  <Box className="underline" w={2 / 6}>
                    {config.employeeId}
                  </Box>
                  <Box className="bold" px={2} w={1 / 6}>
                    Extension:
                  </Box>
                  <Box className="underline" w={2 / 6}>
                    {config.employeeExtension ? config.employeeExtension : nbsp}
                  </Box>
                </Flex>
                <Flex align="left">
                  <Box className="bold" w={1 / 3}>
                    Department:
                  </Box>
                  <Box className="underline" w={2 / 3}>
                    {config.employeeDepartment}
                  </Box>
                </Flex>
                <Flex align="left">
                  <Box className="bold" w={1 / 3}>
                    Location:
                  </Box>
                  <Box className="underline" w={2 / 3}>
                    {config.employeeLocation}
                  </Box>
                </Flex>
                <Flex align="left">
                  <Box className="bold" w={1 / 3}>
                    E-mail:
                  </Box>
                  <Box className="underline" w={2 / 3}>
                    {config.employeeEmail}
                  </Box>
                </Flex>
              </Box>

              <Box px={2} w={3 / 5}>
                <Flex py={1} align="left">
                  <Box className="bold" w={2 / 7}>
                    {nbsp}
                  </Box>
                  <Box className="text-center" w={3 / 7}>
                    Approvals (Print Here)
                  </Box>
                  <Box className="text-center" mx={2} w={2 / 7}>
                    Approvals (Sign Here)
                  </Box>
                </Flex>

                <Flex align="left">
                  <Box className="bold" w={2 / 7}>
                    Department Head:
                  </Box>
                  <Box className="underline" w={3 / 7}>
                    {config.employeeDepartmentHead}
                  </Box>
                  <Box className="underline" mx={2} w={2 / 7}>
                    {nbsp}
                  </Box>
                </Flex>

                <Flex align="left">
                  <Box className="bold" w={2 / 7}>
                    Budget:
                  </Box>
                  <Box className="underline" w={3 / 7}>
                    {nbsp}
                  </Box>
                  <Box className="underline" mx={2} w={2 / 7}>
                    {nbsp}
                  </Box>
                </Flex>

                <Flex align="left">
                  <Box className="bold" w={2 / 7}>
                    Accounts Payable
                  </Box>
                  <Box className="underline" w={3 / 7}>
                    {nbsp}
                  </Box>
                  <Box className="underline" mx={2} w={2 / 7}>
                    {nbsp}
                  </Box>
                </Flex>

                <Flex align="left">
                  <Box w={1}>{nbsp}</Box>
                </Flex>

                <Flex align="left">
                  <Box w={1 / 10}>{nbsp}</Box>
                  <Box className="bold text-left" w={3 / 10}>
                    Rate:
                  </Box>
                  <Box className="underline" w={2 / 10}>
                    ${config.mileageRate}
                  </Box>
                  <Box w={4 / 10}>{nbsp}</Box>
                </Flex>

                <Flex align="left">
                  <Box w={1 / 10}>{nbsp}</Box>
                  <Box className="bold text-left" w={3 / 10}>
                    Total Mileage:
                  </Box>
                  <Box className="underline" w={2 / 10}>
                    ${(mileageTotal * rate).toFixed(2)}
                  </Box>
                  <Box className="bold" px={2} w={2 / 10}>
                    Total Tolls:
                  </Box>
                  <Box className="underline" w={2 / 10}>
                    ${tollsTotal.toFixed(2)}
                  </Box>
                </Flex>

                <Flex align="left">
                  <Box w={1 / 10}>{nbsp}</Box>
                  <Box className="bold text-left" w={3 / 10}>
                    Total Reimbursement:
                  </Box>
                  <Box className="underline" w={2 / 10}>
                    ${(tollsTotal + mileageTotal * rate).toFixed(2)}
                  </Box>
                  <Box w={4 / 10}>{nbsp}</Box>
                </Flex>
              </Box>
            </Flex>

            <Flex py={2} align="center">
              <Box w={1}>
                <Flex align="center ">
                  <Box
                    className="invert-colors bold full-height borders text-center font-large"
                    w={1 / 5}
                  >
                    Fund
                  </Box>
                  <Box
                    className="invert-colors bold full-height borders text-center font-large"
                    w={1 / 5}
                  >
                    Organization
                  </Box>
                  <Box
                    className="invert-colors bold full-height borders text-center font-large"
                    w={1 / 5}
                  >
                    Account
                  </Box>
                  <Box
                    className="invert-colors bold full-height borders text-center font-large"
                    w={1 / 5}
                  >
                    Program
                  </Box>
                  <Box
                    className="invert-colors bold full-height borders text-center font-large"
                    w={1 / 5}
                  >
                    Grand Total
                  </Box>
                </Flex>
                <Flex align="center">
                  <Box
                    className="full-height borders borders text-center"
                    w={1 / 5}
                  >
                    {config.fund}
                  </Box>
                  <Box className="full-height borders text-center" w={1 / 5}>
                    {config.organization}
                  </Box>
                  <Box className="full-height borders text-center" w={1 / 5}>
                    {config.mileageAccount}
                  </Box>
                  <Box className="full-height borders text-center" w={1 / 5}>
                    {config.program}
                  </Box>
                  <Box className="full-height borders text-center" w={1 / 5}>
                    ${(tollsTotal + mileageTotal * rate).toFixed(2)}
                  </Box>
                </Flex>
                <Flex align="center">
                  <Box className="full-height borders text-center" w={1 / 5}>
                    {nbsp}
                  </Box>
                  <Box className="full-height borders text-center" w={1 / 5}>
                    {nbsp}
                  </Box>
                  <Box className="full-height borders text-center" w={1 / 5}>
                    {config.tollsAccount}
                  </Box>
                  <Box className="full-height borders text-center" w={1 / 5}>
                    {nbsp}
                  </Box>
                  <Box className="full-height borders text-center" w={1 / 5}>
                    {nbsp}
                  </Box>
                </Flex>
              </Box>
            </Flex>
          </div>

          <div
            className={
              printing ? 'mileage-log-table-no-scroll' : 'mileage-log-table'
            }
          >
            <Flex className="height-50" align="center">
              <Box className="bold full-height borders text-center" w={1 / 12}>
                Date
              </Box>
              <Box className="bold full-height borders text-center" w={2 / 12}>
                Start Location
              </Box>
              <Box className="bold full-height borders text-center" w={2 / 12}>
                Destination
              </Box>
              <Box className="bold full-height borders text-center" w={3 / 12}>
                Description/Notes
              </Box>
              <Box className="bold full-height borders text-center" w={1 / 12}>
                Mileage
              </Box>
              <Box className="bold full-height borders text-center" w={1 / 12}>
                Tolls
              </Box>
              <Box className="bold full-height borders text-center" w={2 / 12}>
                Reimbursement
              </Box>
            </Flex>

            {outputLog.map(row => (
              <Flex
                className="height-100"
                key={`${config.mileageHeaderLine}${config.tollsHeaderLine}${
                  row.Date
                }${row.Start}`}
                align="center"
              >
                <Box className="full-height borders text-center" w={1 / 12}>
                  {row.Date}
                </Box>
                <Box className="full-height borders text-center" w={2 / 12}>
                  {row['Start Location']}
                </Box>
                <Box className="full-height borders text-center" w={2 / 12}>
                  {row.Destination}
                </Box>
                <Box className="full-height borders text-center" w={3 / 12}>
                  {row['Description/Notes']}
                </Box>
                <Box className="full-height borders text-center" w={1 / 12}>
                  {row.Mileage}
                </Box>
                <Box className="full-height borders text-center" w={1 / 12}>
                  ${row.Tolls}
                </Box>
                <Box className="full-height borders text-center" w={2 / 12}>
                  ${row.Reimbursement}
                </Box>
              </Flex>
            ))}
          </div>

          <div className="mileage-log-footer">
            <Flex className="height-150" align="center">
              <Box className="bold borders full-height" w={7 / 12}>
                I HEREBY CERTIFY THAT THE MILEAGE AND TOLL EXPENSE INDICATED
                ABOVE, WAS ACCOMPLISHED IN THE PERFORMANCE OF OFFICIAL DUTIES
                PURSUANT TO TRAVEL AUTHORITY GRANTED TO ME. I ALSO CERTIFY THAT
                ON THE DATE(S) WHEN THE ABOVE ITEMS OF EXPENSE WERE INCURRED,
                THE VEHICLE I WAS USING ON UNIVERSITY BUSINESS WAS COVERED BY
                LIABILITY INSURANCE.
                <br />
                <br />{' '}
                ________________________________________________________________
                <br />
                (SIGNATURE OF CLAIMANT)
              </Box>

              <Box
                className="bold borders full-height font-large text-center"
                w={1 / 12}
              >
                Total:
              </Box>

              <Box className="bold borders full-height" w={1 / 12}>
                <div className="height-100 borders text-center">
                  ${(mileageTotal * rate).toFixed(2)}
                </div>
                <div className="text-center">{config.mileageAccount}</div>
              </Box>

              <Box className="bold borders full-height" w={1 / 12}>
                <div className="height-100 borders text-center">
                  ${tollsTotal.toFixed(2)}
                </div>
                <div className="text-center">{config.tollsAccount}</div>
              </Box>

              <Box className="bold borders full-height text-center" w={2 / 12}>
                <div>${(tollsTotal + mileageTotal * rate).toFixed(2)}</div>
              </Box>
            </Flex>
          </div>
        </div>
      </div>
    );
  }
}

MileageLog.propTypes = {
  printing: PropTypes.bool.isRequired,
  tolls: PropTypes.arrayOf(PropTypes.object).isRequired,
  trips: PropTypes.arrayOf(PropTypes.object).isRequired,
  config: PropTypes.objectOf(PropTypes.string).isRequired
};

export default MileageLog;
