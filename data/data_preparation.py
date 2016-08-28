import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import json

def fix_cpu(df):
	cpu_fixed = pd.read_csv('cpu_fixed.csv', skipinitialspace=True)

	for index, row in cpu_fixed.iterrows():
		df["cpu"] = df["cpu"].replace(row["a"],row["b"])

	return df

def hierarchical_json(df):
	order = ["distribution","class","architecture","numCores"]
	dist_attr = df["distribution"].unique()
	class_attr = df["class"].unique()
	arch_attr = df["architecture"].unique()
	cores_attr = df["numCores"].unique()
	
	data_dict = {}
	data_dict["name"] = "machine"
	data_dict["size"] = df.shape[0]
	data_dict["children"] = []
	data_dict["depth"] = 0
	
	for dist in dist_attr:
		dist_dict = {}
		dist_dict["name"] = dist
		dist_dict["children"] = []
		data_dict["children"].append(dist_dict)
		
		dist_df = df[df["distribution"] == dist]
		dist_dict["size"] = dist_df.shape[0]
		dist_dict["depth"] = 1
		class_attr = dist_df["class"].unique()
		for class_ in class_attr:
			class_dict = {}
			class_dict["name"] = class_
			class_dict["children"] = []
			dist_dict["children"].append(class_dict)
			
			class_df = dist_df[dist_df["class"] == class_]
			class_dict["size"] = class_df.shape[0]
			class_dict["depth"] = 2
			arch_attr = class_df["architecture"].unique()
			for arch in arch_attr:
				arch_dict = {}
				arch_dict["name"] = arch
				arch_dict["children"] = []
				class_dict["children"].append(arch_dict)

				arch_df = class_df[class_df["architecture"] == arch]
				arch_dict["size"] = arch_df.shape[0]
				arch_dict["depth"] = 3
				core_attr = arch_df["numCores"].unique()
				for core in core_attr:
					core_dict = {}
					core_dict["name"] = core

					core_df = arch_df[arch_df["numCores"] == core]
					core_dict["size"] = core_df.shape[0]
					core_dict["depth"] = 4

					if(core_df.shape[0] != 0):
						arch_dict["children"].append(core_dict)

	return data_dict
	
def main():
	# Dataset linux counter
	df = pd.read_csv('lico.csv', skipinitialspace=True, delimiter=";")

	# Elimino attributi non necessari
	df = df.drop("diskSpace",1)
	df = df.drop("swap",1)
	df = df.drop("memory",1)
	df = df.drop("distroVersion",1)
	df = df.drop("userId",1)
	df = df.drop("kernel",1)
	df = df.drop("cpu",1)
	df = df.drop("country",1)
		
	# Sostituisco valori nulli e \N con "unknown"
	df = df.replace("\\N","unknown")
	df = df.fillna("unknown")

	for a in df:
		df = df[df[a] != "unknown"]

	data_out = hierarchical_json(df)

	with open('data.json', 'w') as outfile:
		json.dump(data_out, outfile, ensure_ascii=False)
	
if __name__ == "__main__":
	main()
