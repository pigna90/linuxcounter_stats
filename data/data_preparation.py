import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

def fix_cpu(df):
	cpu_fixed = pd.read_csv('cpu_fixed.csv', skipinitialspace=True)

	for index, row in cpu_fixed.iterrows():
		df["cpu"] = df["cpu"].replace(row["a"],row["b"])

	return df

def main():
	# Dataset linux counter
	df = pd.read_csv('lico.csv', skipinitialspace=True, delimiter=";")

	# Elimino attributi non necessari
	df = df.drop("diskSpace",1)
	df = df.drop("swap",1)
	df = df.drop("memory",1)
	df = df.drop("distroVersion",1)
		
	# Sostituisco valori nulli e \N con "unknown"
	df = df.replace("\\N","unknown")
	df = df.fillna("unknown")

	new = fix_cpu(df.copy())
	
	new.to_csv("./lico_fixed.csv",index=False)
	
if __name__ == "__main__":
	main()
