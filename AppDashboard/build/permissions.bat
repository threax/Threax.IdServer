icacls . /inheritance:e /grant:r %1:(OI)(CI)(RX,R,X,RD,RA,REA,RC)
mkdir logs
icacls logs /inheritance:e /grant:r %1:(OI)(CI)(D,F,M,W)